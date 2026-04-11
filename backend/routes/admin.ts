import { Router } from "express";
import { authenticate } from "../utils/auth";
import { isAdmin } from "../middleware/adminMiddleware";
import { 
  getAdminStats, 
  getAllUsers, 
  toggleUserStatus, 
  getAllVets, 
  verifyVet, 
  getAllPharmacies, 
  getPharmacyOrders,
  getSettings,
  updateSetting
} from "../controller/adminController";

const router = Router();

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics
 *       403:
 *         description: Forbidden
 */
router.get("/stats", authenticate as any, isAdmin as any, getAdminStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 *       403:
 *         description: Forbidden
 */
router.get("/users", authenticate as any, isAdmin as any, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     tags: [Admin]
 *     summary: Toggle user active status
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
 *         description: User status updated
 *       404:
 *         description: User not found
 */
router.put("/users/:id/status", authenticate as any, isAdmin as any, toggleUserStatus);

/**
 * @swagger
 * /api/admin/vets:
 *   get:
 *     tags: [Admin]
 *     summary: Get all vet applications/profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vet list
 */
router.get("/vets", authenticate as any, isAdmin as any, getAllVets);

/**
 * @swagger
 * /api/admin/vets/{id}/verify:
 *   put:
 *     tags: [Admin]
 *     summary: Verify a vet
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
 *         description: Vet verified
 *       404:
 *         description: Vet not found
 */
router.put("/vets/:id/verify", authenticate as any, isAdmin as any, verifyVet);

/**
 * @swagger
 * /api/admin/pharmacies:
 *   get:
 *     tags: [Admin]
 *     summary: Get all pharmacy accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pharmacy list
 */
router.get("/pharmacies", authenticate as any, isAdmin as any, getAllPharmacies);

/**
 * @swagger
 * /api/admin/pharmacies/{id}/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Get orders for a pharmacy
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
 *         description: Pharmacy orders
 */
router.get("/pharmacies/:id/orders", authenticate as any, isAdmin as any, getPharmacyOrders);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current settings
 */
router.get("/settings", authenticate as any, isAdmin as any, getSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     tags: [Admin]
 *     summary: Update platform settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put("/settings", authenticate as any, isAdmin as any, updateSetting);

export default router;
