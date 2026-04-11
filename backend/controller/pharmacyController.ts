import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import User from "../models/User";
import { AuthRequest } from "../utils/auth";
import { buildEsewaFormData } from "../utils/esewa";
import { sendEmail } from "../utils/mailer";

const parseNumber = (value: any, fallback = 0): number => {
	if (value === undefined || value === null || value === "") return fallback;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value: any, fallback: boolean): boolean => {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		if (value.toLowerCase() === "true") return true;
		if (value.toLowerCase() === "false") return false;
	}
	return fallback;
};

const parseImages = (value: any): Array<{ public_id: string; url: string }> => {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

const getUploadedProductImages = (req: AuthRequest): Array<{ public_id: string; url: string }> => {
	const files = (req as any).files as { images?: Express.Multer.File[] } | Express.Multer.File[] | undefined;
	const singleFile = (req as any).file as Express.Multer.File | undefined;

	let uploadedFiles: Express.Multer.File[] = [];
	if (Array.isArray(files)) {
		uploadedFiles = files;
	} else if (files && Array.isArray(files.images)) {
		uploadedFiles = files.images;
	}

	if (singleFile) {
		uploadedFiles.push(singleFile);
	}

	return uploadedFiles.map((file) => ({
		public_id: file.filename,
		url: `/uploads/products/${file.filename}`
	}));
};

// Pharmacy adds/creates a product
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { name, description, category } = req.body;
		const price = parseNumber(req.body.price);
		const stock = parseNumber(req.body.stock);
		const featured = parseBoolean(req.body.featured, false);
		const isActive = parseBoolean(req.body.isActive, true);
		const uploadedImages = getUploadedProductImages(req);
		const bodyImages = parseImages(req.body.images);

		const normalizedImages = uploadedImages.length > 0
			? uploadedImages
			: bodyImages;

		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Only pharmacy users can add products" });
			return;
		}

		const product = await Product.create({
			name,
			description,
			price,
			category,
			stock,
			images: normalizedImages,
			featured,
			isActive,
			pharmacyId: req.user?.id
		});

		res.status(201).json({
			success: true,
			message: "Product created successfully",
			product
		});
	} catch (error: any) {
		console.error("Error creating product:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create product",
			error: error.message
		});
	}
};

// Pharmacy updates a product
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const uploadedImages = getUploadedProductImages(req);
		const parsedImages = parseImages(req.body.images);

		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Only pharmacy users can update products" });
			return;
		}

		const updateData: any = {};
		if (req.body.name !== undefined) updateData.name = req.body.name;
		if (req.body.description !== undefined) updateData.description = req.body.description;
		if (req.body.category !== undefined) updateData.category = req.body.category;
		if (req.body.price !== undefined) updateData.price = parseNumber(req.body.price);
		if (req.body.stock !== undefined) updateData.stock = parseNumber(req.body.stock);
		if (req.body.featured !== undefined) updateData.featured = parseBoolean(req.body.featured, false);
		if (req.body.isActive !== undefined) updateData.isActive = parseBoolean(req.body.isActive, true);

		if (uploadedImages.length > 0) {
			updateData.images = uploadedImages;
		} else if (req.body.images !== undefined) {
			updateData.images = parsedImages;
		}

		let product = await Product.findById(id);
		if (!product) {
			res.status(404).json({
				success: false,
				message: "Product not found"
			});
			return;
		}

		if (req.user?.role === "pharmacy" && product.pharmacyId && String(product.pharmacyId) !== String(req.user?.id)) {
			res.status(403).json({ success: false, message: "You can only update your own products" });
			return;
		}

		product = await Product.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true
		});

		if (!product) {
			res.status(404).json({
				success: false,
				message: "Product not found"
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Product updated successfully",
			product
		});
	} catch (error: any) {
		console.error("Error updating product:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update product",
			error: error.message
		});
	}
};

// Pharmacy deletes a product
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Only pharmacy users can delete products" });
			return;
		}

		const product = await Product.findById(id);
		if (!product) {
			res.status(404).json({
				success: false,
				message: "Product not found"
			});
			return;
		}

		if (req.user?.role === "pharmacy" && product.pharmacyId && String(product.pharmacyId) !== String(req.user?.id)) {
			res.status(403).json({ success: false, message: "You can only delete your own products" });
			return;
		}

		await Product.findByIdAndDelete(id);

		res.status(200).json({
			success: true,
			message: "Product deleted successfully"
		});
	} catch (error: any) {
		console.error("Error deleting product:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete product",
			error: error.message
		});
	}
};

// Get all products (for all users or filtered by pharmacy)
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
	try {
		const { category, search, featured, includeInactive, pharmacyId } = req.query;

		const filter: any = {};
		if (category) filter.category = category;
		if (featured === "true") filter.featured = true;
		if (pharmacyId) filter.pharmacyId = pharmacyId;
		// By default, only return active products for public listing
		if (includeInactive !== "true") {
			filter.isActive = true;
		}
		if (search) {
			filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
		}

		const products = await Product.find(filter).populate("pharmacyId", "firstName lastName email").sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: products.length,
			products
		});
	} catch (error: any) {
		console.error("Error getting products:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get products",
			error: error.message
		});
	}
};

// Get pharmacy's own products (for pharmacy dashboard)
export const getMyProducts = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ success: false, message: "Access denied" });
			return;
		}

		const filter: any = {};
		if (req.user?.role === "pharmacy") {
			filter.pharmacyId = req.user.id;
		} else if (req.user?.role === "admin") {
			// Admin sees all products
		} else {
			res.status(403).json({ success: false, message: "Access denied" });
			return;
		}

		const products = await Product.find(filter).sort({ createdAt: -1 });

		res.status(200).json({ success: true, count: products.length, products });
	} catch (error: any) {
		res.status(500).json({ success: false, message: "Failed to get products", error: error.message });
	}
};

// Get pharmacy vendors with their products (for customer browse)
export const getPharmacyVendors = async (req: Request, res: Response): Promise<void> => {
	try {
		const pharmacies = await User.find({ role: "pharmacy" }).select("_id firstName lastName email");
		const vendors = [];

		for (const ph of pharmacies) {
			const products = await Product.find({ pharmacyId: ph._id, isActive: true }).sort({ createdAt: -1 });
			if (products.length > 0) {
				vendors.push({ pharmacy: ph, products });
			}
		}

		res.status(200).json({ success: true, vendors });
	} catch (error: any) {
		console.error("Error getting vendors:", error);
		res.status(500).json({ success: false, message: "Failed to get vendors", error: error.message });
	}
};

// Get single product details
export const getProductById = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		const product = await Product.findById(id);

		if (!product) {
			res.status(404).json({
				success: false,
				message: "Product not found"
			});
			return;
		}

		res.status(200).json({
			success: true,
			product
		});
	} catch (error: any) {
		console.error("Error getting product:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get product",
			error: error.message
		});
	}
};

// Initiate eSewa payment for order (creates pending order, returns esewa form data)
export const initiateOrderPayment = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { items, shippingAddress, paymentMethod } = req.body;

		if (!items || items.length === 0) {
			res.status(400).json({ success: false, message: "Order must contain at least one item" });
			return;
		}

		let totalAmount = 0;
		const orderItems: { productId: any; productName: string; price: number; quantity: number }[] = [];
		let pharmacyId: string | null = null;

		for (const item of items) {
			const product = await Product.findById(item.productId);
			if (!product) {
				res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
				return;
			}
			if (product.stock < item.quantity) {
				res.status(400).json({
					success: false,
					message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
				});
				return;
			}
			if (pharmacyId && product.pharmacyId && String(product.pharmacyId) !== pharmacyId) {
				res.status(400).json({ success: false, message: "All items must be from the same pharmacy" });
				return;
			}
			pharmacyId = product.pharmacyId ? String(product.pharmacyId) : null;

			totalAmount += product.price * item.quantity;
			orderItems.push({
				productId: product._id,
				productName: product.name,
				price: product.price,
				quantity: item.quantity
			});
		}

		const user = await User.findById(req.user?.id).select("firstName lastName");
		const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Customer";

		const order = await Order.create({
			userId: req.user?.id,
			userName,
			pharmacyId: pharmacyId || undefined,
			items: orderItems,
			totalAmount,
			shippingAddress: shippingAddress || {},
			paymentMethod: paymentMethod || "esewa",
			status: "pending",
			paymentStatus: "pending"
		});

		const esewaData = buildEsewaFormData({
			amount: totalAmount,
			transactionUuid: String(order._id),
			successPath: `/dashboard/pharmacy/orders/success?orderId=${order._id}`,
			failurePath: `/dashboard/pharmacy/orders/failure?orderId=${order._id}`
		});

		res.status(201).json({
			success: true,
			message: "Order created, redirect to eSewa",
			orderId: order._id,
			esewaData
		});
	} catch (error: any) {
		console.error("Error initiating order payment:", error);
		res.status(500).json({ success: false, message: "Failed to initiate payment", error: error.message });
	}
};

// Verify order payment after eSewa callback
export const verifyOrderPayment = async (req: Request, res: Response): Promise<void> => {
	try {
		const { orderId, status, refId, transactionUuid, transaction_uuid } = req.body;
		const resolvedOrderId = orderId || transactionUuid || transaction_uuid;

		if (!resolvedOrderId) {
			res.status(400).json({ success: false, message: "orderId or transactionUuid is required" });
			return;
		}

		const order = await Order.findById(resolvedOrderId);
		if (!order) {
			res.status(404).json({ success: false, message: "Order not found" });
			return;
		}

		if (status === "success" || status === "COMPLETE") {
			const alreadyCompleted = order.paymentStatus === "completed";
			order.paymentStatus = "completed";
			order.status = "processing";
			order.esewaRefId = refId || (req.body as any).transaction_code;

			const commissionRate = 0.10;
			order.platformFee = order.totalAmount * commissionRate;
			order.netAmount = order.totalAmount - order.platformFee;

			await order.save();

			// Reduce stock only once per successfully completed payment.
			if (!alreadyCompleted) {
				for (const item of order.items) {
					await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
				}
			}

			const user = await User.findById(order.userId).select("email firstName");
			if (user && user.email) {
				const itemList = order.items.map((i: any) => `
					<tr>
						<td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.productName}</td>
						<td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.quantity}</td>
						<td style="padding: 10px; border-bottom: 1px solid #ddd;">Rs. ${i.price}</td>
						<td style="padding: 10px; border-bottom: 1px solid #ddd;">Rs. ${i.price * i.quantity}</td>
					</tr>
				`).join("");
				sendEmail(
					user.email,
					"Invoice & Order Confirmation - PetConnect Pharmacy",
					`
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
						<h2 style="color: #6366f1;">PetConnect Pharmacy</h2>
						<h3 style="color: #333; margin-bottom: 5px;">Invoice & Order Confirmation</h3>
						<p style="color: #666; font-size: 14px; margin-top: 0;">Order ID: ${order._id}</p>
						<p>Dear ${user.firstName || 'Customer'},</p>
						<p>Your payment was successful and your order is now processing. Here are your order and invoice details:</p>
						
						<table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
							<thead>
								<tr style="background-color: #f8fafc;">
									<th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
									<th style="padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
									<th style="padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
									<th style="padding: 10px; border-bottom: 2px solid #ddd;">Total</th>
								</tr>
							</thead>
							<tbody>
								${itemList}
							</tbody>
							<tfoot>
								<tr>
									<td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
									<td style="padding: 10px; font-weight: bold;">Rs. ${order.totalAmount}</td>
								</tr>
							</tfoot>
						</table>
						
						<p style="margin-top: 30px; font-size: 13px; color: #888;">Thank you for your purchase!<br>PetConnect Pharmacy Team</p>
					</div>
					`
				);
			}

		} else {
			order.paymentStatus = "failed";
			order.status = "cancelled";
			await order.save();
		}

		res.status(200).json({ success: true, order });
	} catch (error: any) {
		res.status(500).json({ success: false, message: "Failed to verify payment", error: error.message });
	}
};

// Create order (for customers - cash/after payment)
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { items, shippingAddress, paymentMethod } = req.body;

		if (!items || items.length === 0) {
			res.status(400).json({
				success: false,
				message: "Order must contain at least one item"
			});
			return;
		}

		let totalAmount = 0;
		const orderItems: { productId: any; productName: string; price: number; quantity: number }[] = [];
		let pharmacyId: string | null = null;

		for (const item of items) {
			const product = await Product.findById(item.productId);

			if (!product) {
				res.status(404).json({
					success: false,
					message: `Product with ID ${item.productId} not found`
				});
				return;
			}

			if (product.stock < item.quantity) {
				res.status(400).json({
					success: false,
					message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
				});
				return;
			}

			pharmacyId = product.pharmacyId ? String(product.pharmacyId) : null;
			totalAmount += product.price * item.quantity;

			orderItems.push({
				productId: product._id,
				productName: product.name,
				price: product.price,
				quantity: item.quantity
			});

			product.stock -= item.quantity;
			await product.save();
		}

		const user = await User.findById(req.user?.id).select("firstName lastName");
		const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Customer";

		const order = await Order.create({
			userId: req.user?.id,
			userName,
			pharmacyId: pharmacyId || undefined,
			items: orderItems,
			totalAmount,
			shippingAddress: shippingAddress || {},
			paymentMethod: paymentMethod || "cash",
			status: "pending",
			paymentStatus: paymentMethod === "cash" ? "pending" : "completed",
			platformFee: totalAmount * 0.10,
			netAmount: totalAmount - (totalAmount * 0.10)
		});

		if (user && user.email) {
			const itemList = orderItems.map((i) => `
				<tr>
					<td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.productName}</td>
					<td style="padding: 10px; border-bottom: 1px solid #ddd;">${i.quantity}</td>
					<td style="padding: 10px; border-bottom: 1px solid #ddd;">Rs. ${i.price}</td>
					<td style="padding: 10px; border-bottom: 1px solid #ddd;">Rs. ${i.price * i.quantity}</td>
				</tr>
			`).join("");
			sendEmail(
				user.email,
				"Invoice & Order Placed - PetConnect Pharmacy",
				`
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
					<h2 style="color: #6366f1;">PetConnect Pharmacy</h2>
					<h3 style="color: #333; margin-bottom: 5px;">Invoice & Order Placed</h3>
					<p style="color: #666; font-size: 14px; margin-top: 0;">Order ID: ${order._id}</p>
					<p>Dear ${user.firstName || 'Customer'},</p>
					<p>We've received your order. Payment method: ${paymentMethod}. Here is your invoice:</p>
					
					<table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
						<thead>
							<tr style="background-color: #f8fafc;">
								<th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
								<th style="padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
								<th style="padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
								<th style="padding: 10px; border-bottom: 2px solid #ddd;">Total</th>
							</tr>
						</thead>
						<tbody>
							${itemList}
						</tbody>
						<tfoot>
							<tr>
								<td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
								<td style="padding: 10px; font-weight: bold;">Rs. ${order.totalAmount}</td>
							</tr>
						</tfoot>
					</table>
					
					<p style="margin-top: 30px; font-size: 13px; color: #888;">Thank you for using PetConnect Pharmacy!</p>
				</div>
				`
			);
		}

		res.status(201).json({
			success: true,
			message: "Order placed successfully",
			order
		});
	} catch (error: any) {
		console.error("Error creating order:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create order",
			error: error.message
		});
	}
};

// Get all orders for pharmacy (filtered by pharmacyId for pharmacy role)
export const getPharmacyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Access denied. Only pharmacy users can view orders" });
			return;
		}

		const { status } = req.query;

		const filter: any = {};
		if (status) filter.status = status;
		if (req.user?.role === "pharmacy") {
			filter.pharmacyId = req.user?.id;
		}

		const orders = await Order.find(filter).sort({ createdAt: -1 }).populate("userId", "email firstName lastName phone");

		res.status(200).json({
			success: true,
			count: orders.length,
			orders
		});
	} catch (error: any) {
		console.error("Error getting pharmacy orders:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get orders",
			error: error.message
		});
	}
};

// Get user's own orders
export const getUserOrders = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const orders = await Order.find({ userId: req.user?.id }).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: orders.length,
			orders
		});
	} catch (error: any) {
		console.error("Error getting user orders:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get orders",
			error: error.message
		});
	}
};

// Update order status (for pharmacy)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { status, paymentStatus } = req.body;

		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Only pharmacy users can update order status" });
			return;
		}

		const order = await Order.findById(id);
		if (!order) {
			res.status(404).json({
				success: false,
				message: "Order not found"
			});
			return;
		}

		if (req.user?.role === "pharmacy" && order.pharmacyId && String(order.pharmacyId) !== String(req.user?.id)) {
			res.status(403).json({ success: false, message: "You can only update orders for your pharmacy" });
			return;
		}

		const updateData: any = {};
		if (status) updateData.status = status;
		if (paymentStatus) updateData.paymentStatus = paymentStatus;

		const updated = await Order.findByIdAndUpdate(id, updateData, { new: true });

		if (!updated) {
			res.status(404).json({
				success: false,
				message: "Order not found"
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Order status updated successfully",
			order: updated
		});
	} catch (error: any) {
		console.error("Error updating order status:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update order status",
			error: error.message
		});
	}
};

// Get simple pharmacy stats for dashboard
export const getPharmacyStats = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Access denied. Only pharmacy users can view stats" });
			return;
		}

		const pharmacyFilter = req.user?.role === "pharmacy" ? { pharmacyId: req.user?.id } : {};
		const [activeOrders, completedOrders, activeProducts, totalStock] = await Promise.all([
			Order.countDocuments({ ...pharmacyFilter, status: { $in: ["pending", "processing"] } }),
			Order.countDocuments({ ...pharmacyFilter, status: "delivered" }),
			Product.countDocuments({ ...pharmacyFilter, isActive: true }),
			Product.aggregate([
				{ $match: { ...pharmacyFilter, isActive: true } },
				{ $group: { _id: null, totalStock: { $sum: "$stock" } } }
			])
		]);

		const totalStockValue = totalStock[0]?.totalStock || 0;

		res.status(200).json({
			success: true,
			activeOrders,
			completedOrders,
			activeProducts,
			totalStock: totalStockValue
		});
	} catch (error: any) {
		console.error("Error getting pharmacy stats:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get pharmacy stats",
			error: error.message
		});
	}
};
