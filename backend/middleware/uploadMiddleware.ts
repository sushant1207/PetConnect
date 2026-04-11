import multer from "multer";
import path from "path";
import fs from "fs";

const productsUploadDir = path.join(process.cwd(), "uploads", "products");
const campaignsUploadDir = path.join(process.cwd(), "uploads", "campaigns");

if (!fs.existsSync(productsUploadDir)) {
	fs.mkdirSync(productsUploadDir, { recursive: true });
}

if (!fs.existsSync(campaignsUploadDir)) {
	fs.mkdirSync(campaignsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, productsUploadDir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
		cb(null, `${Date.now()}-${base}${ext}`);
	}
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
	if (!file.mimetype.startsWith("image/")) {
		cb(new Error("Only image files are allowed"));
		return;
	}
	cb(null, true);
};

export const productImageUpload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }
});

const campaignStorage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, campaignsUploadDir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
		cb(null, `${Date.now()}-${base}${ext}`);
	}
});

export const campaignImageUpload = multer({
	storage: campaignStorage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }
});
