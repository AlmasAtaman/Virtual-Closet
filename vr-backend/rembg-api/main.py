# vr-backend/rembg-api/main.py

import os
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from rembg import remove, new_session
from io import BytesIO
from PIL import Image
import uvicorn

app = FastAPI(title="Background Removal API", version="1.0.0")

# Initialize the AI model
session = new_session("isnet-general-use")

@app.get("/")
async def root():
    return {"message": "Background Removal API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/remove-bg/")
async def remove_bg(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        input_bytes = await file.read()
        
        # Convert to PIL Image to validate it's a proper image
        input_image = Image.open(BytesIO(input_bytes)).convert("RGBA")
        
        # Remove background
        output_bytes = remove(input_bytes, session=session)
        
        return StreamingResponse(
            BytesIO(output_bytes), 
            media_type="image/png",
            headers={
                "Content-Disposition": "inline; filename=output.png"
            }
        )
    
    except Exception as e:
        return {"error": f"Failed to process image: {str(e)}"}

if __name__ == "__main__":
    # Railway provides PORT as environment variable
    port = int(os.environ.get("PORT", 9000))
    uvicorn.run(app, host="0.0.0.0", port=port)