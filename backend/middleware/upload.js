const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.FILE_UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(`${uploadDir}/products`)) fs.mkdirSync(`${uploadDir}/products`, { recursive: true });
if (!fs.existsSync(`${uploadDir}/avatars`)) fs.mkdirSync(`${uploadDir}/avatars`, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'products';
    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

const csvFilter = (req, file, cb) => {
  const allowedTypes = /csv|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV/Excel files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

const uploadCSV = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadDir, 'csv')),
    filename: (req, file, cb) => {
      if (!fs.existsSync(path.join(uploadDir, 'csv'))) {
        fs.mkdirSync(path.join(uploadDir, 'csv'), { recursive: true });
      }
      cb(null, `import-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: csvFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { upload, uploadCSV };
