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
import { productImageUpload } from "../middleware/uploadMiddleware";

const router = express.Router();

// Product Routes
/**
 * @swagger
 * /api/pharmacy/products:
 *   get:
 *     tags: [Pharmacy]
 *     summary: Get all pharmacy products
 *     responses:
 *       200:
 *         description: Product list
 */
router.get("/products", getAllProducts);

/**
 * @swagger
 * /api/pharmacy/products/my:
 *   get:
 *     tags: [Pharmacy]
 *     summary: Get products owned by authenticated pharmacy vendor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor products
 *       401:
 *         description: Unauthorized
 */
router.get("/products/my", authenticate, getMyProducts);

/**
 * @swagger
 * /api/pharmacy/products/{id}:
 *   get:
 *     tags: [Pharmacy]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/products/:id", getProductById);

/**
 * @swagger
 * /api/pharmacy/vendors:
 *   get:
 *     tags: [Pharmacy]
 *     summary: Get pharmacy vendors
 *     responses:
 *       200:
 *         description: Vendor list
 */
router.get("/vendors", getPharmacyVendors);

/**
 * @swagger
 * /api/pharmacy/products:
 *   post:
 *     tags: [Pharmacy]
 *     summary: Create new pharmacy product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Unauthorized
 */
router.post(
	"/products",
	authenticate,
	productImageUpload.fields([
		{ name: "images", maxCount: 8 },
		{ name: "image", maxCount: 1 }
	]),
	createProduct
);

/**
 * @swagger
 * /api/pharmacy/products/{id}:
 *   put:
 *     tags: [Pharmacy]
 *     summary: Update pharmacy product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put(
	"/products/:id",
	authenticate,
	productImageUpload.fields([
		{ name: "images", maxCount: 8 },
		{ name: "image", maxCount: 1 }
	]),
	updateProduct
);

/**
 * @swagger
 * /api/pharmacy/products/{id}:
 *   delete:
 *     tags: [Pharmacy]
 *     summary: Delete pharmacy product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete("/products/:id", authenticate, deleteProduct);

// Order Routes
/**
 * @swagger
 * /api/pharmacy/orders:
 *   post:
 *     tags: [PharmacyOrders]
 *     summary: Create a pharmacy order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Unauthorized
 */
router.post("/orders", authenticate, createOrder);

/**
 * @swagger
 * /api/pharmacy/orders/pay/esewa:
 *   post:
 *     tags: [PharmacyOrders]
 *     summary: Initiate eSewa payment for order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initiation data
 */
router.post("/orders/pay/esewa", authenticate, initiateOrderPayment);

/**
 * @swagger
 * /api/pharmacy/orders/pay/verify:
 *   post:
 *     tags: [PharmacyOrders]
 *     summary: Verify order payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Verification failed
 */
router.post("/orders/pay/verify", verifyOrderPayment);

/**
 * @swagger
 * /api/pharmacy/orders/user:
 *   get:
 *     tags: [PharmacyOrders]
 *     summary: Get authenticated user's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders
 *       401:
 *         description: Unauthorized
 */
router.get("/orders/user", authenticate, getUserOrders);

/**
 * @swagger
 * /api/pharmacy/orders:
 *   get:
 *     tags: [PharmacyOrders]
 *     summary: Get pharmacy vendor orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor order list
 *       401:
 *         description: Unauthorized
 */
router.get("/orders", authenticate, getPharmacyOrders);

/**
 * @swagger
 * /api/pharmacy/orders/{id}:
 *   put:
 *     tags: [PharmacyOrders]
 *     summary: Update order status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
router.put("/orders/:id", authenticate, updateOrderStatus);

/**
 * @swagger
 * /api/pharmacy/stats:
 *   get:
 *     tags: [Pharmacy]
 *     summary: Get pharmacy dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pharmacy statistics
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticate, getPharmacyStats);

export default router;
