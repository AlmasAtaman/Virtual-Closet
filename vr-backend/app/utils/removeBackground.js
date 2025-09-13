// vr-backend/app/utils/removeBackground.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function removeBackground(localImagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(localImagePath));

  // Use environment variable instead of hardcoded localhost
  const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:9000";
  
  console.log(`Calling background removal service at: ${PYTHON_SERVICE_URL}`);

  const response = await axios.post(`${PYTHON_SERVICE_URL}/remove-bg/`, form, {
    headers: form.getHeaders(),
    responseType: "stream",
    timeout: 60000, // 60 second timeout for AI processing
  });

  const outputPath = localImagePath.replace(/(\.\w+)$/, "_nobg.png");
  const writer = fs.createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", () => resolve(outputPath));
    writer.on("error", reject);
  });
}