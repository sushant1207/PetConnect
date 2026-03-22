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

router.get("/stats", authenticate as any, isAdmin as any, getAdminStats);
router.get("/users", authenticate as any, isAdmin as any, getAllUsers);
router.put("/users/:id/status", authenticate as any, isAdmin as any, toggleUserStatus);
router.get("/vets", authenticate as any, isAdmin as any, getAllVets);
router.put("/vets/:id/verify", authenticate as any, isAdmin as any, verifyVet);
router.get("/pharmacies", authenticate as any, isAdmin as any, getAllPharmacies);
router.get("/pharmacies/:id/orders", authenticate as any, isAdmin as any, getPharmacyOrders);
router.get("/settings", authenticate as any, isAdmin as any, getSettings);
router.put("/settings", authenticate as any, isAdmin as any, updateSetting);

export default router;
