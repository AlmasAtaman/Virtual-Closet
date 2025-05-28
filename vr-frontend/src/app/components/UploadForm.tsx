"use client";

import React, { useRef, useState } from "react";
import axios from "axios";

async function urlToFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const filename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
  return new File([blob], filename, { type: blob.type });
}


const initialData = {
    name: "",
    type: "",
    brand: "",
    price: "",
    occasion: "",
    style: "",
    fit: "",
    color: "",
    material: "",
    season: "",
    notes: "",
    sourceUrl: "",
};


type ClothingFields = keyof typeof initialData;


export default function UploadForm({
  onUploadComplete,
  currentViewMode = "closet"
}: {
  onUploadComplete?: (target: "closet" | "wishlist", newItem: any) => void;
  currentViewMode?: "closet" | "wishlist";
}) {
  const [mode, setMode] = useState<"basic" | "advanced">("basic");
  const [uploadTarget, setUploadTarget] = useState<"closet" | "wishlist">(currentViewMode);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [cleanedFile, setCleanedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [autoData, setAutoData] = useState<typeof initialData>(initialData);
  const [uploadMethod, setUploadMethod] = useState<"image" | "url">("image");
  const [scrapeData, setScrapeData] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image) return alert("Please select an image");

    const formData = new FormData();
    formData.append("image", image);

    setSubmitting(true);
    try {
      const res = await axios.post("http://localhost:8000/api/images", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { clothingData, imageBuffer, originalname } = res.data;

      if (!clothingData?.isClothing) {
        alert("This image doesn't look like clothing. Try a different image.");
        return;
      }
      console.log("Gemini autofill data:", clothingData);
      setAutoData((prev) => ({
        ...prev,
        name: clothingData?.name ?? prev.name,
        type: clothingData?.type ?? prev.type,
        brand: clothingData?.brand ?? prev.brand,
        price: clothingData?.price ?? prev.price,
        occasion: clothingData?.occasion ?? prev.occasion,
        style: clothingData?.style ?? prev.style,
        fit: clothingData?.fit ?? prev.fit,
        color: clothingData?.color ?? prev.color,
        material: clothingData?.material ?? prev.material,
        season: clothingData?.season ?? prev.season,
        notes: "",
      }));


      // Decode base64 string into binary
      const binary = atob(imageBuffer);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Create a File object from buffer
      const blob = new Blob([bytes], { type: "image/jpeg" });
      const file = new File([blob], originalname, { type: "image/jpeg" });
      setCleanedFile(file);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
  if (uploadMethod === "image" && !cleanedFile) return alert("No cleaned image to submit.");
  if (uploadMethod === "url" && !selectedImage) return alert("No image selected from URL.");

  setSubmitting(true);
  setLoading(true);

  const formData = new FormData();
  let finalFile: File | null = null;

  if (uploadMethod === "image") {
    finalFile = cleanedFile;
  } else if (uploadMethod === "url" && selectedImage) {
    try {
        // Send the selected image URL to backend for processing on submit
        const res = await axios.post("http://localhost:8000/api/scrape", {
            url: selectedImage, // Send the selected image URL
            process: true // Indicate processing is needed
        });

        if (res.data.processedImage?.imageBuffer) {
            const { clothingData, imageBuffer, originalname } = res.data.processedImage;
            const binary = atob(imageBuffer);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "image/png" });
            finalFile = new File([blob], originalname || 'processed.png', { type: "image/png" });

            // Update autoData with processed clothing data
            setAutoData(prev => ({ ...prev, ...clothingData }));

        } else {
            alert("Failed to process image from URL.");
            console.error("Image processing failed for selected image:", res.data);
            setSubmitting(false);
            setLoading(false);
            return;
        }

    } catch (err) {
      alert("Failed to process image from URL.");
      console.error(err);
      setSubmitting(false);
      setLoading(false);
      return;
    }
  }

  // Append the finalFile (either from direct upload or processed URL) to formData
  if (finalFile) {
    formData.append("image", finalFile);
  } else {
      // This case should ideally not happen if checks at the beginning pass,
      // but as a fallback, maybe alert or handle appropriately.
       alert("No image file available for submission.");
       setSubmitting(false);
       setLoading(false);
       return;
  }


    if (uploadTarget === "wishlist" && !autoData.sourceUrl) {
      alert("Source URL is required for wishlist items.");
      return;
    }

    formData.append("url", uploadMethod === "image" ? previewUrl! : selectedImage!);
    formData.append("name", autoData.name);
    formData.append("type", autoData.type);
    formData.append("brand", autoData.brand);
    formData.append("price", autoData.price || "");
    formData.append("mode", uploadTarget); 
    if (uploadTarget === "wishlist" && autoData.sourceUrl) {
      formData.append("sourceUrl", autoData.sourceUrl);
    }



    if (mode === "advanced") {
      ["occasion", "style", "fit", "color", "material", "season", "notes"].forEach((field) => {
        formData.append(field, autoData[field as keyof typeof autoData] || "");
      });
    }

    try {
      const res = await axios.post("http://localhost:8000/api/images/final-submit", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("UploadForm: Final submit successful. Response data:", res.data);

      alert("Clothing submitted!");

      // Reset
      setImage(null);
      setPreviewUrl(null);
      setAutoData(initialData);
      setCleanedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (onUploadComplete) onUploadComplete(uploadTarget, res.data.item);
      setLoading(false);

    } catch (err) {
      console.error("Submit failed", err);
      alert("Submit failed");
      setLoading(false);
    }
  };


  return (
    <div className="border p-4 rounded-xl max-w-md mx-auto">
    <div className="mb-3 flex items-center gap-4">
      <span className="text-sm font-medium">Upload Target:</span>
      <button
        onClick={() => setUploadTarget(uploadTarget === "closet" ? "wishlist" : "closet")}
        className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-500 text-sm shadow"
      >
        {uploadTarget === "closet" ? "Switch to Wishlist" : "Switch to Closet"}
      </button>
    </div>
      <div className="mb-3 flex items-center gap-4">
      <span className="text-sm font-medium">Upload Mode:</span>
      <button
        onClick={() => setMode(mode === "basic" ? "advanced" : "basic")}
        className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 text-sm shadow"
      >
        {mode === "basic" ? "Switch to Advanced Mode" : "Switch to Basic Mode"}
      </button>
    </div>
    {uploadTarget === "wishlist" && (
      <div className="mb-3 flex items-center gap-4">
        <span className="text-sm font-medium">Upload Method:</span>
        <button
          onClick={() => setUploadMethod((m) => (m === "image" ? "url" : "image"))}
          className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 text-sm shadow"
        >
          {uploadMethod === "image" ? "Switch to URL" : "Switch to Image"}
        </button>
      </div>
    )}

{/* Render content based on upload method */}
{uploadMethod === "image" ? (
  <>
    {/* IMAGE MODE specific elements */}
    <label className="block w-full cursor-pointer mb-2 text-white text-sm font-medium">
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </label>
    {previewUrl && uploadMethod === "image" && mode === "basic" && (
        <img src={previewUrl} alt="Preview" className="w-full max-h-80 object-contain mb-4 rounded" />
    )}
  </>
) : (
  <>
    {/* URL MODE specific elements */}
    <input
      type="text"
      placeholder="Paste product URL"
      value={autoData.sourceUrl}
      onChange={(e) => setAutoData({ ...autoData, sourceUrl: e.target.value })}
      className="w-full border px-3 py-2 rounded mb-3"
    />
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      onClick={async () => {
        setLoading(true);
        try {
          const res = await axios.post("http://localhost:8000/api/scrape", {
            url: autoData.sourceUrl,
          });
          const data = res.data;

          // Only set scrape data and select the first image for preview
          setSelectedImage(data.imageUrl || data.imageGallery?.[0] || null);
          setScrapeData(data);
           setAutoData((prev) => ({
            ...prev,
            name: data.name || "",
            brand: data.brand || "",
            price: data.price || "",
            currency: data.currency || "",
            description: data.description || "",
            type: data.type || "",
            occasion: data.occasion || "",
            style: data.style || "",
            fit: data.fit || "",
            color: data.color || "",
            material: data.material || "",
            season: data.season || "",
            notes: data.notes || "",
            sourceUrl: data.sourceUrl || autoData.sourceUrl,
          }));

        } catch (err) {
          console.error("Failed to fetch URL data:", err);
          alert("Failed to scrape URL");
        } finally {
            setLoading(false);
        }
      }}
    >
      {loading ? "Fetching..." : "Fetch Info"}
    </button>

    {scrapeData && (
      <>
        {selectedImage && (
            <div className="w-full max-h-80 flex justify-center items-center mb-4 border rounded">
                <img src={selectedImage} alt="Selected Product Image" className="max-h-full object-contain" />
            </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {scrapeData.imageGallery?.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              onClick={() => setSelectedImage(img)}
              className={`h-24 w-24 object-cover rounded border-4 cursor-pointer ${
                selectedImage === img ? "border-blue-500" : "border-transparent"
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {["name", "type", "brand", ...(uploadTarget === "wishlist" ? ["price"] : [])].map((field) => (
            <input
              key={`basic-${field}`}
              type="text"
              placeholder={field}
              value={autoData[field as ClothingFields]}
              onChange={(e) => setAutoData({ ...autoData, [field]: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          ))}
        </div>
      </>
    )}
  </>
)}

{/* Render common content based on mode (Basic/Advanced) */}
{mode === "advanced" ? (
    <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Image preview for advanced mode (appears for both image and url methods)*/}
        {(previewUrl || (selectedImage && uploadMethod === "url")) && mode === "advanced" && (
            () => {
                const advancedPreviewSrc = uploadMethod === "image" ? previewUrl : selectedImage;
                if (advancedPreviewSrc) {
                    return (
                        <div className="flex-1 max-w-sm">
                            <img src={advancedPreviewSrc} alt="Preview" className="w-full object-contain rounded border" />
                        </div>
                    );
                }
                return null;
            }
        )()}
        <div className="flex-1 space-y-3">
            {/* Advanced mode fields */}
            {["name", "type", "brand", "price", "occasion", "style", "fit", "color", "material", "season"].map((field) => (
                <input
                    key={`advanced-${field}`}
                    type="text"
                    placeholder={field}
                    value={autoData[field as ClothingFields]}
                    onChange={(e) => setAutoData({ ...autoData, [field]: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                />
            ))}
            <textarea
                placeholder="Notes"
                value={autoData.notes}
                onChange={(e) => setAutoData({ ...autoData, notes: e.target.value })}
                className="w-full border px-3 py-2 rounded h-24"
            />
        </div>
    </div>
) : (
    <>
        {/* Basic mode fields */}
        <div className="space-y-2 mt-4">
            {["name", "type", "brand", ...(uploadTarget === "wishlist" ? ["price"] : [])].map((field) => (
                <input
                    key={`basic-${field}`}
                    type="text"
                    placeholder={field}
                    value={autoData[field as ClothingFields]}
                    onChange={(e) => setAutoData({ ...autoData, [field]: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                />
            ))}
        </div>
    </>
)}

{/* Image gallery for URL mode */}
{uploadMethod === "url" && scrapeData && mode === "basic" && (
    <div className="flex gap-2 mb-4 overflow-x-auto">
        {scrapeData.imageGallery?.map((img: string, idx: number) => (
            <img
                key={idx}
                src={img}
                onClick={() => setSelectedImage(img)}
                className={`h-24 w-24 object-cover rounded border-4 cursor-pointer ${
                    selectedImage === img ? "border-blue-500" : "border-transparent"
                }`}
            />
        ))}
    </div>
)}



      {/* Source URL input for all wishlist uploads, both modes */}
      {uploadTarget === "wishlist" && (
        <input
          type="text"
          placeholder="Source URL (required for wishlist)"
          value={autoData.sourceUrl || ""}
          onChange={(e) => setAutoData({ ...autoData, sourceUrl: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-2 mt-2"
        />
      )}

      <div className="flex gap-4 mt-4">
        {uploadMethod === "image" && (
          <button
            onClick={handleUpload}
            disabled={submitting || !image}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Auto-fill"}
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={
            (uploadMethod === "image" && !cleanedFile) ||
            (uploadMethod === "url" && !selectedImage) ||
            !autoData.name ||
            !autoData.type ||
            (uploadTarget === "wishlist" && !autoData.sourceUrl) ||
            loading
          }
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>

    </div>
  );

}
