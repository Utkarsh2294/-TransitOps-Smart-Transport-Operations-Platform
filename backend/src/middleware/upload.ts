import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

import multer from "multer";

const uploadDirectory = path.resolve(process.cwd(), "uploads");
mkdirSync(uploadDirectory, { recursive: true });

export const uploadsPath = uploadDirectory;

export const documentUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error("Only PDF, JPG, and PNG files are allowed"));
  },
});
