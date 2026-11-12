import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import sharp from 'sharp';

import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImage,
} from '../src/lib/share-images';
import type { ShareImageFont } from './fonts';
import {
  ShareImageCard,
  TITLE_LINE_HEIGHT,
  TITLE_MAX_LINES,
  TITLE_SIZE,
  TITLE_WIDTH,
  TitleProbe,
  type ShareImageAside,
  type TitleWords,
} from './share-image';

export interface FittedTitle {
  readonly words: TitleWords;
  readonly fontSize: number;
  /** The grey half was cut short with an ellipsis. */
  readonly truncated: boolean;
}

function words(text: string | null): string[] {
  return (text ?? '').split(/\s+/).filter(Boolean);
}

/** The first `count` words of the grey half, ending in "…" when any were dropped. */
function truncateQuiet(quiet: readonly string[], count: number): string[] {
  if (count >= quiet.length) return [...quiet];
  if (count === 0) return [];
  const kept = quiet.slice(0, count);
  const last = kept[count - 1].replace(/[\s.,;:!?…–—-]+$/u, '');
  return [...kept.slice(0, -1), `${last}…`];
}

/**
 * Renders share images with `@vercel/og` (`next/og`'s `ImageResponse`: Satori, then resvg).
 * Satori doesn't report layout, so fitting a title renders a probe (the title, unpainted,
 * with a bar under it) and reads the bar's position back with sharp.
 */
export class ShareImageRenderer {
  constructor(
    private readonly fonts: readonly ShareImageFont[],
    private readonly host: string,
  ) {}

  private async png(element: ReactElement, width: number, height: number) {
    const response = new ImageResponse(element, {
      width,
      height,
      fonts: [...this.fonts],
    });
    return Buffer.from(await response.arrayBuffer());
  }

  /** How many lines the title takes at `fontSize` in a column `width` wide. */
  async lineCount(
    title: TitleWords,
    fontSize: number,
    width: number,
  ): Promise<number> {
    const lineHeight = fontSize * TITLE_LINE_HEIGHT;
    const height = Math.ceil(lineHeight * (TITLE_MAX_LINES + 2)) + 8;
    const png = await this.png(
      <TitleProbe words={title} fontSize={fontSize} width={width} />,
      width,
      height,
    );
    const { data, info } = await sharp(png)
      .removeAlpha()
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // The bar is 8px wide at the left edge; find its top row.
    for (let row = 0; row < info.height; row += 1) {
      if (data[row * info.width + 2] < 128) {
        return Math.round(row / lineHeight);
      }
    }
    return Number.POSITIVE_INFINITY;
  }

  /**
   * 05 §1: at most three lines. Start at 76px (64px beside a preview), shrink in 4px steps to
   * 56px, then cut the grey half short with an ellipsis. The `fg` half is never truncated.
   */
  async fitTitle(image: ShareImage, hasAside: boolean): Promise<FittedTitle> {
    const width = hasAside ? TITLE_WIDTH.withAside : TITLE_WIDTH.alone;
    const start = hasAside ? TITLE_SIZE.withAside : TITLE_SIZE.alone;
    const title = words(image.title);
    const quiet = words(image.quiet);

    for (
      let fontSize = start;
      fontSize >= TITLE_SIZE.min;
      fontSize -= TITLE_SIZE.step
    ) {
      if (
        (await this.lineCount({ title, quiet }, fontSize, width)) <=
        TITLE_MAX_LINES
      ) {
        return { words: { title, quiet }, fontSize, truncated: false };
      }
    }

    // The most grey words that still fit in three lines at 56px (binary search).
    const fontSize = TITLE_SIZE.min;
    let low = 0;
    let high = quiet.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const lines = await this.lineCount(
        { title, quiet: truncateQuiet(quiet, middle) },
        fontSize,
        width,
      );
      if (lines <= TITLE_MAX_LINES) low = middle;
      else high = middle - 1;
    }
    return {
      words: { title, quiet: truncateQuiet(quiet, low) },
      fontSize,
      truncated: true,
    };
  }

  /** The finished 1200×630 PNG. */
  async render(
    image: ShareImage,
    options: {
      readonly aside: ShareImageAside | null;
      readonly latest: boolean;
    },
  ): Promise<{ readonly png: Buffer; readonly title: FittedTitle }> {
    const title = await this.fitTitle(image, options.aside !== null);
    const png = await this.png(
      <ShareImageCard
        image={image}
        host={this.host}
        words={title.words}
        fontSize={title.fontSize}
        aside={options.aside}
        latest={options.latest}
      />,
      SHARE_IMAGE_WIDTH,
      SHARE_IMAGE_HEIGHT,
    );
    return { png, title };
  }
}
