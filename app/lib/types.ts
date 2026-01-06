
export interface ImageData {
  id: string;
  url: string;
  file: File | null;
  width: number;
  height: number;
  type: 'base' | 'source';
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  imageId: string;
}

export interface FusionParameters {
  fabricWeight: number;      // 0-100
  drapeMatch: number;         // 0-100
  seamlessBlend: number;      // 0-100
}

export interface FusionRequest {
  baseImage: string;          // base64 or URL
  sourceImage: string;        // base64 or URL
  selectionBox: SelectionBox;
  prompt: string;
  parameters: FusionParameters;
}

export interface FusionResult {
  success: boolean;
  resultImage: string;        // base64
  confidence: number;
  processingTime: number;
  error?: string;
}