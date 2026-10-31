const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Đường dẫn thư mục lưu ảnh upload: backend/uploads
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// Kiểm tra loại file (chỉ chấp nhận ảnh)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file hình ảnh (JPG, PNG, WEBP, GIF, SVG)!"), false);
  }
};

// Khởi tạo Multer instance với giới hạn 10MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
});

/**
 * @route POST /api/upload
 * @desc Upload 1 file ảnh sản phẩm từ máy tính
 */
router.post("/", (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Kích thước ảnh vượt quá giới hạn 10MB!",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload ảnh: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Không thể tải lên file!",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn một file ảnh từ máy tính!",
      });
    }

    // Tạo URL truy cập ảnh
    const protocol = req.protocol;
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    console.log(`📸 [Image Uploaded] Lưu tại: ${req.file.path} -> URL: ${fileUrl}`);

    return res.status(200).json({
      success: true,
      message: "Tải ảnh từ máy tính thành công!",
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  });
});

module.exports = router;
