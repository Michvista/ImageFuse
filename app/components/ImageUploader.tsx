"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  label: string;
  currentImage?: string;
}

export default function ImageUploader({
  onImageUpload,
  label,
  currentImage,
}: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageUpload(acceptedFiles[0]);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  } as any);

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-stone-700 mb-2 block">
        {label}
      </label>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-[#8C4B3D] bg-[#8C4B3D]/5"
              : "border-[#E6DDD0] hover:border-[#8C4B3D]/50"
          }
          ${currentImage ? "min-h-[200px]" : "min-h-[150px]"}
        `}>
        <input {...(getInputProps() as any)} />

        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt="Uploaded"
              className="max-h-[300px] mx-auto rounded object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded">
              <p className="text-white font-medium">Click to change image</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#E6DDD0] flex items-center justify-center">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-[#8C4B3D]" />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#8C4B3D]" />
              )}
            </div>
            <div>
              <p className="font-medium text-stone-700">
                {isDragActive ? "Drop image here" : "Drag & drop image here"}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                or click to browse (PNG, JPG, WEBP)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
