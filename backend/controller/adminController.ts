import { Response } from "express";
import os from "os";
import { execSync } from "child_process";
import { AuthRequest } from "../utils/auth";
import User from "../models/User";
import Doctor from "../models/Doctor";
import Appointment from "../models/Appointment";
import Order from "../models/Order";
import Donation from "../models/Donation";
import Setting from "../models/Setting";

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      userCount,
      doctorCount,
      appointmentCount,
      orderCount,
      pendingVets,
      revenueStats
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Doctor.countDocuments({}),
      Appointment.countDocuments({}),
      Order.countDocuments({ status: { $ne: "cancelled" } }),
      Doctor.countDocuments({ isActive: false }),
      Donation.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const totalDonations = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // Recent activities (last 5)
    const recentUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("email firstName lastName role createdAt lastLoginIp lastLoginDate");

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("userName totalAmount status createdAt");

    // Dynamic System Health Calculation
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    
    let diskUsage = 5; // Fallback
    try {
       const dfOutput = execSync("df -h / | tail -1").toString();
       const percentStr = dfOutput.split(/\s+/).filter(v => v.includes("%"))[0];
       diskUsage = parseInt(percentStr) || 5;
    } catch {}

    const cpuLoad = Math.round(os.loadavg()[0] * 10);
    const systemHealth = Math.max(0, 100 - (cpuLoad / 10 + (memUsage > 90 ? 10 : 0)));

    res.status(200).json({
      stats: {
        users: userCount,
        doctors: doctorCount,
        appointments: appointmentCount,
        orders: orderCount,
        pendingVets,
        donations: totalDonations,
        systemHealth: systemHealth.toFixed(1),
        resources: {
           cpu: cpuLoad > 100 ? 100 : cpuLoad,
           memory: memUsage,
           disk: diskUsage
        }
      },
      recentActivities: {
        users: recentUsers,
        orders: recentOrders
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch admin stats" });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .select("+lastLoginIp +lastLoginDate");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();
    res.json({ message: `User is now ${user.status}`, user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllVets = async (req: AuthRequest, res: Response) => {
  try {
    const vets = await Doctor.find({}).sort({ createdAt: -1 });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyVet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vet = await Doctor.findById(id);
    if (!vet) return res.status(404).json({ message: "Vet not found" });
    
    vet.isActive = !vet.isActive;
    await vet.save();
    res.json({ message: `Vet status updated`, vet });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPharmacies = async (req: AuthRequest, res: Response) => {
  try {
    const pharmacies = await User.find({ role: "pharmacy" }).sort({ createdAt: -1 });
    res.json(pharmacies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPharmacyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ pharmacyId: id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await Setting.find({});
    // If empty, seed initial
    if (settings.length === 0) {
      const initial = [
        { key: "ip_restriction", value: true, label: "IP Whitelist Restriction", description: "Restrict panel access to authorized whitelists", category: "security" },
        { key: "pharmacy_commission", value: 8.5, label: "Pharmacy Commission", description: "Percentage per order", category: "commerce" },
        { key: "login_tracking", value: true, label: "Login Tracking", description: "Capture IP and timestamp on login", category: "security" }
      ];
      const seeded = await Setting.insertMany(initial);
      return res.json(seeded);
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const setting = await Setting.findOneAndUpdate({ key }, { value }, { new: true });
    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
