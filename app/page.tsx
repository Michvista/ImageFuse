"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Save } from "lucide-react";
import ImageCanvas from "./components/ImageCanvas";
import ImageUploader from "./components/ImageUploader";
import { SelectionBox, FusionParameters, FusionRequest } from "./lib/types";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [fusionPrompt, setFusionPrompt] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(98);

  const [parameters, setParameters] = useState<FusionParameters>({
    fabricWeight: 65,
    drapeMatch: 85,
    seamlessBlend: 92,
  });

  const handleBaseImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBaseImage(url);
    toast.success("Base image loaded");
  };

  const handleSourceImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSourceImage(url);
    toast.success("Source image loaded");
  };

  const handleFusion = async () => {
    if (!baseImage || !sourceImage || !selection) {
      toast.error("Please upload both images and select a region");
      return;
    }

    if (!fusionPrompt.trim()) {
      toast.error("Please provide a fusion prompt");
      return;
    }

    setIsProcessing(true);

    try {
      const request: FusionRequest = {
        baseImage,
        sourceImage,
        selectionBox: selection,
        prompt: fusionPrompt,
        parameters,
      };

      const response = await fetch("/api/fusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setResultImage(data.resultImage);
        setConfidence(data.confidence);
        toast.success("Fusion completed successfully!");
      } else {
        toast.error(data.error || "Fusion failed");
      }
    } catch (error) {
      console.error("Fusion error:", error);
      toast.error("An error occurred during fusion");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-stone-900">
      <Toaster position="top-right" />

      {/* Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center">
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-lg rounded-full px-6 py-3 max-w-5xl w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-stone-900 text-lg font-serif font-bold tracking-tight">
              ImageFuse{" "}
              <span className="text-[#8C4B3D] font-sans text-sm font-normal mx-1">
                //
              </span>{" "}
              Atelier
            </h2>
          </div>
          <button className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span className="font-serif italic">Save Project</span>
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-10 px-6 lg:px-12">
        <header className="w-full max-w-[1400px] mx-auto mb-8 text-center">
          <h1 className="text-[#8C4B3D] tracking-[0.2em] text-xs md:text-sm font-bold uppercase mb-3">
            Garment Customization Suite
          </h1>
          <h2 className="text-stone-900 text-4xl md:text-5xl font-serif font-medium tracking-tight">
            Atelier{" "}
            <span className="text-[#E6DDD0] mx-2 font-light text-3xl">//</span>{" "}
            Workspace
          </h2>
        </header>

        {/* Upload Section */}
        {(!baseImage || !sourceImage) && (
          <div className="max-w-4xl mx-auto mb-10 grid md:grid-cols-2 gap-6">
            <ImageUploader
              label="Base Garment"
              onImageUpload={handleBaseImageUpload}
              currentImage={baseImage || undefined}
            />
            <ImageUploader
              label="Detail Source"
              onImageUpload={handleSourceImageUpload}
              currentImage={sourceImage || undefined}
            />
          </div>
        )}

        {/* Main Workspace */}
        {baseImage && sourceImage && (
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            {/* Base Image */}
            <div className="lg:col-span-4">
              <ImageCanvas
                imageUrl={baseImage}
                onSelectionChange={() => {}}
                title="Base Garment"
                subtitle="Original / Foundation"
                canSelect={false}
              />
            </div>

            {/* Controls & Preview */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Preview */}
              <div className="relative bg-white rounded-sm shadow-xl border border-[#E6DDD0] overflow-hidden aspect-square">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur border border-[#E6DDD0] text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C4B3D] animate-pulse"></span>
                  {isProcessing ? "Processing..." : "Live Preview"}
                </div>

                {resultImage ? (
                  <img
                    src={resultImage}
                    alt="Fusion result"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <p className="text-sm font-serif">
                      Fusion result will appear here
                    </p>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-[#E6DDD0]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">
                      Fusion Confidence
                    </span>
                    <span className="text-xs font-bold text-[#8C4B3D] font-mono">
                      {confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E6DDD0]/50 rounded-full h-1">
                    <div
                      className="bg-[#8C4B3D] h-1 rounded-full transition-all duration-500"
                      style={{ width: `${confidence}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white rounded-sm p-6 shadow-sm border border-[#E6DDD0]/50">
                <div className="mb-6">
                  <h3 className="text-stone-900 font-serif italic text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#8C4B3D]" />
                    Fusion Prompt
                  </h3>
                  <textarea
                    value={fusionPrompt}
                    onChange={(e) => setFusionPrompt(e.target.value)}
                    className="w-full bg-[#F9F6F0] border border-[#E6DDD0] rounded p-4 text-sm text-stone-700 focus:ring-1 focus:ring-[#8C4B3D] focus:border-[#8C4B3D] outline-none resize-none h-28 font-serif leading-relaxed"
                    placeholder="Fuse these knitted cuffs onto the linen shirt, maintaining original drape and adjusting for fabric weight differences..."
                  />
                </div>

                <div className="space-y-5 mb-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Fabric Weight
                      </label>
                      <span className="text-xs font-serif">
                        {parameters.fabricWeight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={parameters.fabricWeight}
                      onChange={(e) =>
                        setParameters({
                          ...parameters,
                          fabricWeight: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Drape Match
                      </label>
                      <span className="text-xs font-serif">
                        {parameters.drapeMatch}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={parameters.drapeMatch}
                      onChange={(e) =>
                        setParameters({
                          ...parameters,
                          drapeMatch: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Seamless Blend
                      </label>
                      <span className="text-xs font-serif">
                        {parameters.seamlessBlend}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={parameters.seamlessBlend}
                      onChange={(e) =>
                        setParameters({
                          ...parameters,
                          seamlessBlend: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={handleFusion}
                  disabled={isProcessing || !selection}
                  className="w-full py-4 bg-[#8C4B3D] hover:bg-[#7a3e31] disabled:bg-stone-300 text-white rounded-sm font-bold tracking-widest text-xs transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-3 group uppercase">
                  {isProcessing ? "Processing..." : "Initialize Fusion"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Source Image with Selection */}
            <div className="lg:col-span-4">
              <ImageCanvas
                imageUrl={sourceImage}
                onSelectionChange={(selection) =>
                  setSelection(
                    selection ? { ...selection, imageId: sourceImage! } : null
                  )
                }
                title="Detail Source"
                subtitle="Feature Selection"
                canSelect={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
