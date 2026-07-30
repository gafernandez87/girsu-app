export function hexToNumber(hexColor: string): number {
  return Number.parseInt(hexColor.replace('#', ''), 16);
}

export function darken(color: number, amount: number): number {
  const red = Math.floor(((color >> 16) & 255) * amount);
  const green = Math.floor(((color >> 8) & 255) * amount);
  const blue = Math.floor((color & 255) * amount);

  return (red << 16) + (green << 8) + blue;
}

export function lighten(color: number, amount: number): number {
  const red = Math.min(255, Math.floor(((color >> 16) & 255) * amount));
  const green = Math.min(255, Math.floor(((color >> 8) & 255) * amount));
  const blue = Math.min(255, Math.floor((color & 255) * amount));

  return (red << 16) + (green << 8) + blue;
}
