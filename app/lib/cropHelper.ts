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

  const scale = Math.min(
    container.clientWidth / img.width,
    container.clientHeight / img.height,
  );
  const offsetX = (container.clientWidth - img.width * scale) / 2;
  const offsetY = (container.clientHeight - img.height * scale) / 2;
  const clamp = (value: number, max: number) =>
    Math.max(0, Math.min(max, value));

  const sx = clamp((selection.x - offsetX) / scale, img.width);
  const sy = clamp((selection.y - offsetY) / scale, img.height);
  const endX = clamp(
    (selection.x + selection.width - offsetX) / scale,
    img.width,
  );
  const endY = clamp(
    (selection.y + selection.height - offsetY) / scale,
    img.height,
  );
  const sw = endX - sx;
  const sh = endY - sy;

  if (sw <= 0 || sh <= 0) {
    throw new Error("The selection must overlap the displayed image.");
  }

  canvas.width = Math.ceil(sw);
  canvas.height = Math.ceil(sh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}
export { cropImageToBase64 };
