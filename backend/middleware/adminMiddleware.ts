import { Response, NextFunction } from "express";
import { AuthRequest } from "../utils/auth";

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access only" });
  }
};
