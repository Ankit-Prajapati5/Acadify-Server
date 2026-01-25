import multer from "multer";

const storage = multer.memoryStorage(); // ✅ NO uploads folder

const upload = multer({
  storage,
});

export default upload;
