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

    // Prepare the prompt array with text and both images
    const promptArray = [
      { text: fusionPrompt },
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

    console.log("🚀 Calling Gemini 2.5 Flash Image API...");

    // Call Gemini API with the image generation model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: promptArray,
    });

    console.log("✅ Gemini API responded");

    // Process the response
    let generatedImageBase64: string | null = null;
    let analysisText = "";

    // Extract text and image from response parts
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Check for text response (analysis/description)
        if (part.text) {
          analysisText += part.text;
          console.log("📝 Analysis text found");
        }
        // Check for generated image
        else if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data ?? null;
          console.log("🖼️  Generated image found!");
          console.log(`   Format: ${part.inlineData.mimeType}`);
        }
      }
    }

    // Calculate confidence score based on parameters
    const avgConfidence = Math.round(
      (parameters.fabricWeight +
        parameters.drapeMatch +
        parameters.seamlessBlend) /
        3
    );

    // Prepare the result image
    let resultImage: string;
    let hasGeneratedImage = false;

    if (generatedImageBase64) {
      // Format as data URL for frontend display
      resultImage = `data:image/png;base64,${generatedImageBase64}`;
      hasGeneratedImage = true;
      console.log("✨ Fusion successful! Returning generated image.");
    } else {
      // Fallback to base image if no image was generated
      resultImage = baseImage;
      console.log("⚠️  No image generated, returning base image as fallback");
    }

    // Return success response
    return NextResponse.json({
      success: true,
      resultImage: resultImage,
      confidence: avgConfidence,
      processingTime: 2500, // Approximate
      analysis: analysisText || "Image fusion completed",
      hasGeneratedImage: hasGeneratedImage,
      message: hasGeneratedImage
        ? "🎉 Image fusion completed successfully!"
        : "⚠️ Analysis completed but no image was generated. The model may need more specific instructions.",
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
    model: "gemini-2.5-flash-image",
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
