export interface PostkitEmailActionModel {
  readonly href: string;
  readonly label: string;
}

export interface PostkitEmailMediaModel {
  readonly action: PostkitEmailActionModel;
  readonly caption?: string;
  readonly poster?: string;
  readonly title: string;
}

function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createPostkitEmailAction(
  label: string | undefined,
  href: string | undefined,
): PostkitEmailActionModel | undefined {
  const normalizedLabel = optionalText(label);
  const normalizedHref = optionalText(href);
  return normalizedLabel && normalizedHref
    ? { href: normalizedHref, label: normalizedLabel }
    : undefined;
}

export function createPostkitEmailMediaModel({
  src,
  title,
  caption,
  poster,
  actionLabel,
}: {
  readonly src: string;
  readonly title: string;
  readonly caption?: string;
  readonly poster?: string;
  readonly actionLabel: string;
}): PostkitEmailMediaModel {
  return {
    action: { href: src.trim(), label: actionLabel },
    caption: optionalText(caption),
    poster: optionalText(poster),
    title: title.trim(),
  };
}

export function numericEmailDimension(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}
