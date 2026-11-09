import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { SupportImageError, SUPPORT_IMAGE_BYTES } from "../lib/supportImages.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SUPPORT_IMAGE_BYTES, files: 3, fields: 1, fieldSize: 100 * 1024, parts: 4 },
}).array("screenshots", 3);

export const uploadSupportScreenshots: RequestHandler = (req, res, next) => {
  upload(req, res, error => {
    if (!error || error instanceof multer.MulterError) { next(error); return; }
    res.status(400).json({ error: { code: "INVALID_UPLOAD", message: "The screenshot upload could not be read. Choose the files again and retry." } });
  });
};

export const parseSupportPayload: RequestHandler = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    try { req.body = JSON.parse(req.body.payload); }
    catch { res.status(400).json({ error: { code: "INVALID_JSON", message: "Ticket fields must contain valid JSON" } }); return; }
  }
  next();
};

export const supportUploadError: ErrorRequestHandler = (error, _req, res, next) => {
  if (!(error instanceof SupportImageError)) { next(error); return; }
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
};
