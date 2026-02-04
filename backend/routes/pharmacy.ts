import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getAllProducts,
	getProductById,
	createOrder,
	getPharmacyOrders,
	getUserOrders,
	updateOrderStatus
} from "../controller/pharmacyController";
import { authenticate } from "../utils/auth";

const router = express.Router();

// Product Routes
// Public route - anyone can view products
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);

// Protected routes - pharmacy only
router.post("/products", authenticate, createProduct);
router.put("/products/:id", authenticate, updateProduct);
router.delete("/products/:id", authenticate, deleteProduct);

// Order Routes
// Protected routes - authenticated users
router.post("/orders", authenticate, createOrder);
router.get("/orders/user", authenticate, getUserOrders);

// Protected routes - pharmacy only
router.get("/orders", authenticate, getPharmacyOrders);
router.put("/orders/:id", authenticate, updateOrderStatus);

export default router;
