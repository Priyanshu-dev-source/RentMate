import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../../config/cloudinary";
import { authenticate } from "../../middleware/auth.middleware";
import { ApiResponse } from "../../utils/api-response";
import { AppError } from "../../helpers/app-error";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catch-async";

const router = Router();

// Multer memory storage — files stay in RAM buffer, no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per file
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * POST /api/v1/upload
 * Accepts multipart/form-data with an "image" field.
 * Uploads the image buffer to Cloudinary and returns the public URL.
 */
router.post(
  "/",
  authenticate,
  upload.single("image"),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.badRequest("No image file provided");
    }

    // Upload buffer to Cloudinary using a stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "rentmate/listings",
            resource_type: "image",
            transformation: [
              { width: 1200, height: 800, crop: "limit" }, // cap resolution
              { quality: "auto", fetch_format: "auto" },    // auto-optimize
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            } else {
              reject(new Error("Upload returned no result"));
            }
          }
        );
        uploadStream.end(req.file!.buffer);
      }
    );

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

/**
 * POST /api/v1/upload/multiple
 * Accepts multipart/form-data with up to 6 "images" fields.
 * Uploads all to Cloudinary and returns array of public URLs.
 */
router.post(
  "/multiple",
  authenticate,
  upload.array("images", 6),
  catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw AppError.badRequest("No image files provided");
    }

    const uploadPromises = files.map(
      (file) =>
        new Promise<{ secure_url: string; public_id: string }>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "rentmate/listings",
                resource_type: "image",
                transformation: [
                  { width: 1200, height: 800, crop: "limit" },
                  { quality: "auto", fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else if (result) {
                  resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                  });
                } else {
                  reject(new Error("Upload returned no result"));
                }
              }
            );
            uploadStream.end(file.buffer);
          }
        )
    );

    const results = await Promise.all(uploadPromises);

    return ApiResponse.success({
      res,
      statusCode: StatusCodes.CREATED,
      message: `${results.length} image(s) uploaded successfully`,
      data: results.map((r) => ({
        url: r.secure_url,
        publicId: r.public_id,
      })),
    });
  })
);

export default router;
