import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Helper function to convert data URL to base64
function dataUrlToBase64(dataUrl: string): { mimeType: string; data: string } {
  // Data URL format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error("Invalid data URL format");
  }

  return {
    mimeType: matches[1], // e.g., "image/jpeg"
    data: matches[2], // base64 string without prefix
  };
}

// Helper function to extract base64 from various formats
function extractBase64(imageString: string): {
  mimeType: string;
  data: string;
} {
  // If it's already a data URL
  if (imageString.startsWith("data:")) {
    return dataUrlToBase64(imageString);
  }

  // If it's just base64 (assume PNG for compatibility)
  return {
    mimeType: "image/png",
    data: imageString,
  };
}

function getImageModels(): string[] {
  const primary = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-nano-banana-2.1";
  const fallbacks = (
    process.env.GEMINI_IMAGE_FALLBACK_MODELS ||
    "gemini-3.1-flash-image,gemini-3-pro-image"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fallbacks])];
}

function getReasoningModels(): string[] {
  const primary = process.env.GEMINI_REASONING_MODEL?.trim() || "gemini-3.8-flash";
  const fallbacks = (
    process.env.GEMINI_REASONING_FALLBACK_MODELS || "gemini-flash-latest"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fallbacks])];
}

async function createFusionPlan(
  fusionPrompt: string,
  referenceImages: Array<{ inlineData: { mimeType: string; data: string } }>,
): Promise<string> {
  const analysisPrompt = `${fusionPrompt}

Analyze the base garment, source garment, and selected detail image. Return a concise, actionable visual editing plan for an image-generation model. Specify the exact feature to transfer, placement, scale, orientation, fabric details, lighting, and what must remain unchanged. Do not claim to generate an image.`;
  const models = getReasoningModels();
  let lastError: unknown;

  for (const [index, model] of models.entries()) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ text: analysisPrompt }, ...referenceImages],
      });
      const plan = (response.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("\n")
        .trim();

      if (!plan) throw new Error(`${model} returned no visual editing plan.`);
      return plan;
    } catch (error) {
      lastError = error;
      if (index < models.length - 1) {
        console.warn(`[Gemini] ${model} analysis failed; trying ${models[index + 1]}.`, error);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini could not create a visual editing plan.");
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    const {
      baseImage,
      sourceImage,
      selectionBox,
      prompt,
      parameters,
      detailImage,
    } = body;

    // Validate required fields
    if (
      !baseImage ||
      !sourceImage ||
      !selectionBox ||
      !prompt ||
      !detailImage
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: baseImage, sourceImage, selectionBox, or prompt",
        },
        { status: 400 }
      );
    }

    console.log("🎨 Starting image fusion process...");
    console.log("📦 Selection box:", selectionBox);
    console.log("⚙️  Parameters:", parameters);

    // Convert images to proper base64 format
    const baseImageData = extractBase64(baseImage);
    const sourceImageData = extractBase64(sourceImage);
    const detailImageData = extractBase64(detailImage);


    console.log("✅ Images extracted successfully");
    console.log(`   Base image: ${baseImageData.mimeType}`);
    console.log(`   Source image: ${sourceImageData.mimeType}`);

    // Create the detailed prompt for image fusion
    const fusionPrompt = `You are an expert AI fashion designer specializing in garment fusion and image editing.

TASK: Create a new image by seamlessly fusing specific features from the SOURCE image onto the BASE image.

BASE IMAGE (Image 1): This is the foundation garment that will receive the new features.

SOURCE IMAGE (Image 2): This contains the feature that should be extracted and transferred to the base image.

DETAIL IMAGE (Image 3):
This image shows the EXACT feature to be transferred.
Focus exclusively on this element when fusing it onto the base garment.


USER'S FUSION REQUEST:
"${prompt}"

FUSION PARAMETERS (use these to guide the quality):
- Fabric Weight: ${parameters.fabricWeight}% 
  (Higher = heavier, more substantial fabric appearance)
- Drape Match: ${parameters.drapeMatch}%
  (Higher = match the fabric flow and fall more closely)
- Seamless Blend: ${parameters.seamlessBlend}%
  (Higher = smoother, more invisible transitions at boundaries)

INSTRUCTIONS:
1. Analyze the selected region in the source image to identify the exact feature to transfer
2. Extract that feature (sleeves, collar, pockets, patterns, etc.) from the source image
3. Intelligently place and blend it onto the base garment image
4. Maintain realistic fabric physics, proper lighting, and natural shadows
5. Ensure seamless integration at all boundaries
6. Preserve the original quality, style, and perspective of the base garment
7. The result should look like a single, naturally photographed garment

Generate the fused image now.`;

    const referenceImages = [
      {
        inlineData: {
          mimeType: baseImageData.mimeType,
          data: baseImageData.data,
        },
      },
      {
        inlineData: {
          mimeType: sourceImageData.mimeType,
          data: sourceImageData.data,
        },
      },
      {
        inlineData: {
          mimeType: detailImageData.mimeType,
          data: detailImageData.data,
        },
      },
    ];

    const visualPlan = await createFusionPlan(fusionPrompt, referenceImages);
    const imagePrompt = `${fusionPrompt}

VISUAL EDITING PLAN FROM GEMINI 3.8 FLASH:
${visualPlan}

Use this plan to generate the fused garment image. Preserve the base image everywhere outside the requested edit.`;
    const promptArray = [{ text: imagePrompt }, ...referenceImages];

    // Try the configured image model first, then other supported image models.
    let generatedImageBase64: string | null = null;
    let analysisText = "";

    const imageModels = getImageModels();
    for (const [index, model] of imageModels.entries()) {
      try {
        console.log(`🚀 Calling Gemini image model: ${model}`);
        const response = await ai.models.generateContent({
          model,
          contents: promptArray,
        });

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.text) analysisText += part.text;
          if (part.inlineData?.data) {
            generatedImageBase64 = part.inlineData.data;
            console.log(`🖼️ Generated image with ${model} (${part.inlineData.mimeType})`);
            break;
          }
        }

        if (generatedImageBase64) break;
        if (index < imageModels.length - 1) {
          console.warn(`[Gemini] ${model} returned no image; trying the next image model.`);
        }
      } catch (error) {
        if (index === imageModels.length - 1) throw error;
        console.warn(`[Gemini] ${model} failed; trying the next image model.`, error);
      }
    }

    if (!generatedImageBase64) {
      throw new Error("Gemini image models returned no generated image. Check model access and API quota.");
    }

    // Calculate confidence score based on parameters
    const avgConfidence = Math.round(
      (parameters.fabricWeight +
        parameters.drapeMatch +
        parameters.seamlessBlend) /
        3
    );

    // Prepare the result image
    const resultImage = `data:image/png;base64,${generatedImageBase64}`;
    console.log("✨ Fusion successful! Returning generated image.");

    // Return success response
    return NextResponse.json({
      success: true,
      resultImage: resultImage,
      confidence: avgConfidence,
      processingTime: 2500, // Approximate
      analysis: analysisText || "Image fusion completed",
      hasGeneratedImage: true,
      message: "🎉 Image fusion completed successfully!",
    });
  } catch (error: any) {
    console.error("❌ Fusion API error:", error);

    // More detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred during fusion",
        details: error.toString(),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Optional GET endpoint for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    service: "ImageFuse Fusion API",
    version: "1.0.0",
    model: process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1",
    fallbackModels:
      process.env.GEMINI_IMAGE_FALLBACK_MODELS ||
      "gemini-3.1-flash-image,gemini-3-pro-image",
    reasoningModel: process.env.GEMINI_REASONING_MODEL || "gemini-3.8-flash",
    reasoningFallbackModels:
      process.env.GEMINI_REASONING_FALLBACK_MODELS || "gemini-flash-latest",
    endpoints: {
      POST: "/api/fusion - Process image fusion with Gemini AI",
      GET: "/api/fusion - Health check",
    },
    environment: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
