// vr-backend/app/utils/removeBackground.js
import Replicate from "replicate";
import fs from "fs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function removeBackground(localImagePath) {
  try {
    console.log(`Processing background removal for: ${localImagePath}`);

    // Read the image file and convert to base64
    const imageBuffer = fs.readFileSync(localImagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Run the model with the correct API format
    const output = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      {
        input: {
          image: base64Image,
        }
      }
    );

    console.log("Background removed, writing result...");

    // The output is now a file object that can be written directly
    const outputPath = localImagePath.replace(/(\.\w+)$/, "_nobg.png");
    
    // Write the file to disk using the new API
    await fs.promises.writeFile(outputPath, output);

    console.log(`Background removal complete: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error("Replicate background removal error:", error);
    throw new Error(`Background removal failed: ${error.message}`);
  }
}