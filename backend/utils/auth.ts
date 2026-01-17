import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
	user?: {
		id: string;
		role: string;
	};
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "No token provided" });
	}

	const token = authHeader.split(" ")[1];
	const secret = process.env.JWT_SECRET || "dev_secret";

	try {
		const decoded = jwt.verify(token, secret) as { sub: string; role: string };
		req.user = {
			id: decoded.sub,
			role: decoded.role,
		};
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
