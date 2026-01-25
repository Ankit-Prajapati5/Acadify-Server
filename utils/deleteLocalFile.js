// utils/deleteLocalFile.js
import fs from "fs";
import path from "path";

export const deleteLocalFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.resolve(filePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.log("Local file delete error:", err.message);
    }
  });
};
