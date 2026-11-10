import type { ComponentAnatomyLayer } from '@postkit/content';

/**
 * Layout for the exploded anatomy view (01 §6.3), derived from the four designed boards
 * (SiteComponentCallout, SiteComponentKeyTakeaway, SiteComponentCodeBlock,
 * SiteComponentFigure). Every number below reproduces their markup; nothing is per-component.
 *
 * Coordinates are CSS pixels in the diagram's own box (the "stage"), which is scaled down
 * as a whole when the column is narrower than it.
 */

/** The skew every plane sits on: `matrix(a, b, c, d, 0, 0)`. */
export const PLANE_MATRIX = {
  a: 0.927,
  b: 0.232,
  c: -0.375,
  d: 0.575,
} as const;
export const PLANE_TRANSFORM = `matrix(${PLANE_MATRIX.a}, ${PLANE_MATRIX.b}, ${PLANE_MATRIX.c}, ${PLANE_MATRIX.d}, 0, 0)`;

/** The top plane's top edge. */
const STAGE_TOP = 24;
/** The leftmost point of every plane (its skewed bottom-left corner). */
const STAGE_LEFT = 18;
/** Room under the lowest plane. */
const STAGE_BOTTOM = 24;
/** Vertical distance between planes: 70 unless labels would crowd (CodeBlock uses 92). */
const MIN_SPACING = 70;
const MAX_SPACING = 160;
/** A label may be pushed this far below its dot before the planes spread out instead. */
const MAX_LABEL_PUSH = 12;
/** Labels sit at least this far apart, top to top. */
const MIN_LABEL_GAP = 62;
/** The connector runs from the dot to the elbow, then 20px on to 10px short of the label. */
const ELBOW_GAP = 22;
export const LABEL_WIDTH = 232;
/** Phones: room right of the planes once the labels have gone. */
const PHONE_RIGHT = 14;

/** A label's height: an 18px title line, a 3px gap, then 19.6px description lines. */
const LABEL_TITLE_HEIGHT = 21;
const LABEL_LINE_HEIGHT = 19.6;
/** A conservative average advance at 13.5px (mixed prose and 12px mono), in px. */
const LABEL_CHAR_WIDTH = 6.6;
const LABEL_TEXT_WIDTH = LABEL_WIDTH - 26;

export interface AnatomyPlaneLayout {
  readonly index: number;
  readonly layer: ComponentAnatomyLayer;
  /** The last layer: the whole component. Drawn solid, with no inner outline box. */
  readonly isRoot: boolean;
  /** The plane's top-left corner before the skew (the transform origin). */
  readonly top: number;
  /** The connector's dot: the right edge of the part's box, halfway down, after the skew. */
  readonly dot: { readonly x: number; readonly y: number };
  /** The label's line, after collision avoidance pushed it down (if it did). */
  readonly labelY: number;
  /** The label's top edge. */
  readonly labelTop: number;
}

export interface AnatomyLayout {
  /** The flat component's size: the root (last) layer's box. */
  readonly plane: { readonly width: number; readonly height: number };
  readonly planeLeft: number;
  readonly planes: readonly AnatomyPlaneLayout[];
  readonly elbowX: number;
  readonly labelLeft: number;
  /** The desktop stage, labels included. */
  readonly stage: { readonly width: number; readonly height: number };
  /** The phone stage: the planes and their numbers, no labels. */
  readonly phoneStage: { readonly width: number; readonly height: number };
  /** Where the planes come to rest when assembled, per stage. */
  readonly assembled: {
    readonly stage: { readonly left: number; readonly top: number };
    readonly phoneStage: { readonly left: number; readonly top: number };
  };
  /** The three dashed guides that tie the planes' corners together. */
  readonly guides: readonly {
    readonly x: number;
    readonly y1: number;
    readonly y2: number;
  }[];
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** A label's height, estimated from its description (Markdown code ticks removed). */
function estimateLabelHeight(description: string): number {
  const length = description.replace(/`/g, '').length;
  const lines = Math.max(
    1,
    Math.ceil((length * LABEL_CHAR_WIDTH) / LABEL_TEXT_WIDTH),
  );
  return LABEL_TITLE_HEIGHT + lines * LABEL_LINE_HEIGHT;
}

function project(left: number, top: number, x: number, y: number) {
  const { a, b, c, d } = PLANE_MATRIX;
  return { x: left + a * x + c * y, y: top + b * x + d * y };
}

/**
 * @param measuredLabelHeights The labels' rendered heights, once the browser has laid them
 *   out. Before that (and on the server) each height is estimated from its description.
 */
export function computeAnatomyLayout(
  layers: readonly ComponentAnatomyLayer[],
  measuredLabelHeights?: readonly number[] | null,
): AnatomyLayout {
  const { a, b, c, d } = PLANE_MATRIX;
  const root = layers[layers.length - 1].box;
  const width = root.x + root.w;
  const height = root.y + root.h;
  const planeLeft = Math.floor(STAGE_LEFT - c * height);

  // Each part's anchor on its own flat plane.
  const anchors = layers.map(({ box }) => ({
    x: box.x + box.w >= width ? width : box.x + box.w - 4,
    y: box.y + box.h / 2,
  }));
  const labelHeights = layers.map(
    (layer, index) =>
      measuredLabelHeights?.[index] || estimateLabelHeight(layer.description),
  );

  const place = (spacing: number) => {
    let push = 0;
    let previous = -Infinity;
    const placed = layers.map((layer, index) => {
      const top = STAGE_TOP + index * spacing;
      const dot = project(planeLeft, top, anchors[index].x, anchors[index].y);
      const gap =
        index === 0 ? 0 : Math.max(MIN_LABEL_GAP, labelHeights[index - 1] + 2);
      const labelY = Math.max(dot.y, previous + gap);
      push = Math.max(push, labelY - dot.y);
      previous = labelY;
      return { index, layer, top, dot, labelY };
    });
    return { placed, push };
  };

  let spacing = MIN_SPACING;
  let result = place(spacing);
  while (result.push > MAX_LABEL_PUSH && spacing < MAX_SPACING) {
    spacing += 1;
    result = place(spacing);
  }

  const planes: AnatomyPlaneLayout[] = result.placed.map((plane) => ({
    index: plane.index,
    layer: plane.layer,
    isRoot: plane.index === layers.length - 1,
    top: plane.top,
    dot: { x: round1(plane.dot.x), y: round1(plane.dot.y) },
    labelY: round1(plane.labelY),
    labelTop: Math.round(plane.labelY - 11),
  }));

  const planeRight = planeLeft + a * width;
  const elbowX = Math.round(planeRight + ELBOW_GAP);
  const labelLeft = elbowX + 30;
  const lastTop = planes[planes.length - 1].top;
  const planesBottom = lastTop + b * width + d * height;
  const last = planes[planes.length - 1];

  const stage = {
    width: labelLeft + LABEL_WIDTH,
    height: Math.ceil(
      Math.max(
        planesBottom + STAGE_BOTTOM,
        last.labelTop + labelHeights[labelHeights.length - 1],
      ),
    ),
  };

  // Phones swap the labels for numbers beside each dot (20px badges, 6px right of it).
  const badgesRight = Math.max(...planes.map((plane) => plane.dot.x + 26));
  const phoneStage = {
    width: Math.ceil(Math.max(planeRight + PHONE_RIGHT, badgesRight + 4)),
    height: Math.ceil(planesBottom + STAGE_BOTTOM),
  };

  const centre = (box: { width: number; height: number }) => ({
    left: Math.floor((box.width - width) / 2),
    top: Math.floor((box.height - height) / 2),
  });

  const topLeftBottom = project(planeLeft, STAGE_TOP, 0, height);
  const topRight = project(planeLeft, STAGE_TOP, width, 0);
  const topBottomRight = project(planeLeft, STAGE_TOP, width, height);
  const drop = lastTop - STAGE_TOP;

  return {
    plane: { width, height },
    planeLeft,
    planes,
    elbowX,
    labelLeft,
    stage,
    phoneStage,
    assembled: { stage: centre(stage), phoneStage: centre(phoneStage) },
    guides: [topLeftBottom, topRight, topBottomRight].map((corner) => ({
      x: round1(corner.x),
      y1: round1(corner.y),
      y2: round1(corner.y + drop),
    })),
  };
}
