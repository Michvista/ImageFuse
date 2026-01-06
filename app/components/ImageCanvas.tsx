"use client";

import { useRef, useEffect, useState } from "react";
import { Check } from "lucide-react";

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCanvasProps {
  imageUrl: string;
  onSelectionChange: (selection: SelectionBox | null) => void;
  title: string;
  subtitle: string;
  canSelect?: boolean;
}

export default function ImageCanvas({
  imageUrl,
  onSelectionChange,
  title,
  subtitle,
  canSelect = false,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<SelectionBox | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      drawCanvas(img, null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawCanvas = (img: HTMLImageElement, box: SelectionBox | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const container = containerRef.current;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Calculate scaling to fit image
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    );

    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Draw selection box if exists
    if (box && canSelect) {
      ctx.strokeStyle = "#f4e225";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw corners
      const cornerSize = 12;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#f4e225";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      const corners = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x, y: box.y + box.height },
        { x: box.x + box.width, y: box.y + box.height },
      ];

      corners.forEach((corner) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, cornerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Draw semi-transparent overlay with selection visible
      ctx.fillStyle = "rgba(244, 226, 37, 0.05)";
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
  };

  useEffect(() => {
    if (image) {
      drawCanvas(image, currentBox);
    }
  }, [currentBox, image]);

 const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
   const canvas = canvasRef.current;
   if (!canvas) return { x: 0, y: 0 };

   const rect = canvas.getBoundingClientRect();
   return {
     x: e.clientX - rect.left,
     y: e.clientY - rect.top,
   };
 };

 const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
   if (!canSelect) return;

   e.preventDefault();
   canvasRef.current?.setPointerCapture(e.pointerId);

   const pos = getPointerPos(e);
   setIsDrawing(true);
   setStartPoint(pos);
   setCurrentBox(null);
 };

 const handlePointerUp = () => {
   if (!canSelect) return;

   setIsDrawing(false);

   if (currentBox && currentBox.width > 20 && currentBox.height > 20) {
     onSelectionChange(currentBox);
   }
 };

 const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
   if (!isDrawing || !canSelect) return;

   const pos = getPointerPos(e);

   const box: SelectionBox = {
     x: Math.min(startPoint.x, pos.x),
     y: Math.min(startPoint.y, pos.y),
     width: Math.abs(pos.x - startPoint.x),
     height: Math.abs(pos.y - startPoint.y),
   };

   setCurrentBox(box);
 };



  // const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  //   if (!canSelect) return;

  //   const pos = getPointerPos(e);
  //   setIsDrawing(true);
  //   setStartPoint(pos);
  //   setCurrentBox(null);
  // };

  // const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  //   if (!isDrawing || !canSelect) return;

  //   const pos = getPointerPos(e);
  //   const box: SelectionBox = {
  //     x: Math.min(startPoint.x, pos.x),
  //     y: Math.min(startPoint.y, pos.y),
  //     width: Math.abs(pos.x - startPoint.x),
  //     height: Math.abs(pos.y - startPoint.y),
  //   };

  //   setCurrentBox(box);
  // };

  // const handleMouseUp = () => {
  //   if (!canSelect) return;

  //   setIsDrawing(false);
  //   if (currentBox && currentBox.width > 20 && currentBox.height > 20) {
  //     onSelectionChange(currentBox);
  //   }
  // };

  return (
    <div className="flex flex-col gap-4 group">
      <div className="flex items-center justify-between px-1 border-b border-[#E6DDD0]/50 pb-2">
        <p className="text-lg font-serif font-medium text-stone-800">{title}</p>
        {canSelect && currentBox && (
          <div className="flex items-center gap-2 text-xs text-[#8C4B3D]">
            <Check className="w-4 h-4" />
            <span>Selection Active</span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative bg-white rounded-sm overflow-hidden shadow-soft aspect-[3/4] border border-[#E6DDD0]/30">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`w-full h-full touch-none ${
            canSelect ? "cursor-crosshair" : ""
          }`}
        />

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-900/80 via-stone-900/40 to-transparent pointer-events-none">
          <p className="text-white font-serif text-xl italic">{title}</p>
          <p className="text-white/80 text-xs font-display uppercase tracking-wider mt-1">
            {subtitle}
          </p>
        </div>

        {canSelect && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-[#E6DDD0] text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Draw to Select
          </div>
        )}
      </div>

      {canSelect && (
        <div className="px-2">
          <p className="text-xs text-stone-500 leading-relaxed font-serif italic">
            <span className="not-italic font-bold text-[#8C4B3D] mr-1">
              Tip:
            </span>
            Draw a box around the specific feature (e.g., sleeves) you wish to
            transfer.
          </p>
        </div>
      )}
    </div>
  );
}
