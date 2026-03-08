import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import User from "../models/User";
import { AuthRequest } from "../utils/auth";
import { buildEsewaFormData } from "../utils/esewa";

// Pharmacy adds/creates a product
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { name, description, price, category, stock, images, featured, isActive } = req.body;

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
			images: images || [],
			featured: featured || false,
			isActive: typeof isActive === "boolean" ? isActive : true,
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
		const { name, description, price, category, stock, images, featured, isActive } = req.body;

		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Only pharmacy users can update products" });
			return;
		}

		const updateData: any = { name, description, price, category, stock, images, featured };
		if (typeof isActive === "boolean") {
			updateData.isActive = isActive;
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
		const { orderId, status, refId } = req.body;

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, message: "Order not found" });
			return;
		}

		if (status === "success" || status === "COMPLETE") {
			order.paymentStatus = "completed";
			order.esewaRefId = refId || (req.body as any).transaction_code;
			await order.save();

			// Reduce stock on success
			for (const item of order.items) {
				await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
			}
		} else {
			order.paymentStatus = "failed";
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
			paymentStatus: paymentMethod === "cash" ? "pending" : "completed"
		});

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
