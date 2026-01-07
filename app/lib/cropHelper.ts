async function cropImageToBase64(
  imageUrl: string,
  selection: { x: number; y: number; width: number; height: number },
  container: HTMLDivElement
): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  await new Promise((res) => (img.onload = res));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const scaleX = img.width / container.clientWidth;
  const scaleY = img.height / container.clientHeight;

  const sx = selection.x * scaleX;
  const sy = selection.y * scaleY;
  const sw = selection.width * scaleX;
  const sh = selection.height * scaleY;

  canvas.width = sw;
  canvas.height = sh;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvas.toDataURL("image/png");
}
export { cropImageToBase64 };