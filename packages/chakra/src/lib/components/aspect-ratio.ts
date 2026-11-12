export function numericAspectRatio(
  value: number | string | undefined,
  fallback = 16 / 9,
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  if (typeof value === 'string') {
    const [widthValue, heightValue] = value.split('/').map(Number);
    const ratio =
      heightValue === undefined ? widthValue : widthValue / heightValue;
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }

  return fallback;
}
