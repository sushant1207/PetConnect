import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getAllProducts,
	getProductById,
	getMyProducts,
	getPharmacyVendors,
	createOrder,
	initiateOrderPayment,
	verifyOrderPayment,
	getPharmacyOrders,
	getUserOrders,
	updateOrderStatus,
	getPharmacyStats
} from "../controller/pharmacyController";
import { authenticate } from "../utils/auth";

const router = express.Router();

// Product Routes
router.get("/products", getAllProducts);
router.get("/products/my", authenticate, getMyProducts);
router.get("/products/:id", getProductById);
router.get("/vendors", getPharmacyVendors);
router.post("/products", authenticate, createProduct);
router.put("/products/:id", authenticate, updateProduct);
router.delete("/products/:id", authenticate, deleteProduct);

// Order Routes
router.post("/orders", authenticate, createOrder);
router.post("/orders/pay/esewa", authenticate, initiateOrderPayment);
router.post("/orders/pay/verify", verifyOrderPayment);
router.get("/orders/user", authenticate, getUserOrders);

router.get("/orders", authenticate, getPharmacyOrders);
router.put("/orders/:id", authenticate, updateOrderStatus);

router.get("/stats", authenticate, getPharmacyStats);

export default router;
