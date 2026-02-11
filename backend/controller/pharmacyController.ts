import { Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import { AuthRequest } from "../utils/auth";

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
			isActive: typeof isActive === "boolean" ? isActive : true
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

		const product = await Product.findByIdAndUpdate(id, updateData, {
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

		const product = await Product.findByIdAndDelete(id);

		if (!product) {
			res.status(404).json({
				success: false,
				message: "Product not found"
			});
			return;
		}

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

// Get all products (for all users)
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
	try {
		const { category, search, featured, includeInactive } = req.query;

		const filter: any = {};
		if (category) filter.category = category;
		if (featured === "true") filter.featured = true;
		// By default, only return active products for public listing
		if (includeInactive !== "true") {
			filter.isActive = true;
		}
		if (search) {
			filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }];
		}

		const products = await Product.find(filter).sort({ createdAt: -1 });

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

// Create order (for customers)
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

		// Calculate total amount and validate products
		let totalAmount = 0;
		const orderItems = [];

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

			totalAmount += product.price * item.quantity;

			orderItems.push({
				productId: product._id,
				productName: product.name,
				price: product.price,
				quantity: item.quantity
			});

			// Reduce stock
			product.stock -= item.quantity;
			await product.save();
		}

		const order = await Order.create({
			userId: req.user?.id,
			userName: "Customer",
			items: orderItems,
			totalAmount,
			shippingAddress,
			paymentMethod: paymentMethod || "cash",
			status: "pending",
			paymentStatus: paymentMethod === "cash" ? "pending" : "pending"
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

// Get all orders for pharmacy
export const getPharmacyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		// Verify user is pharmacy/admin
		if (req.user?.role !== "pharmacy" && req.user?.role !== "admin") {
			res.status(403).json({ message: "Access denied. Only pharmacy users can view all orders" });
			return;
		}

		const { status } = req.query;

		const filter: any = {};
		if (status) filter.status = status;

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

		const updateData: any = {};
		if (status) updateData.status = status;
		if (paymentStatus) updateData.paymentStatus = paymentStatus;

		const order = await Order.findByIdAndUpdate(id, updateData, { new: true });

		if (!order) {
			res.status(404).json({
				success: false,
				message: "Order not found"
			});
			return;
		}

		res.status(200).json({
			success: true,
			message: "Order status updated successfully",
			order
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

		const [activeOrders, completedOrders, activeProducts, totalStock] = await Promise.all([
			Order.countDocuments({ status: { $in: ["pending", "processing"] } }),
			Order.countDocuments({ status: "delivered" }),
			Product.countDocuments({ isActive: true }),
			Product.aggregate([
				{ $match: { isActive: true } },
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
