import { Box, chakra, type SystemStyleObject } from '@chakra-ui/react';
import type { ComponentAnatomyLayer } from '@postkit/content';
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { segmentedOnSubtle } from '../components/usage-panel';
import { SegmentedControl } from '../primitives';
import {
  computeAnatomyLayout,
  LABEL_WIDTH,
  PLANE_TRANSFORM,
  type AnatomyLayout,
} from './geometry';

/** The boards' phone rule (max-width 760px); `md` starts at 761px. */
const PHONE_QUERY = '(max-width: 760px)';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

type View = 'exploded' | 'assembled';

const VIEW_ITEMS = [
  { value: 'exploded', label: 'Explode' },
  { value: 'assembled', label: 'Assemble' },
] as const;

/** 01 §6.3: the layers move flat over 0.55s on `cubic-bezier(.2,.7,.2,1)`. */
const anatomyMove = '{durations.anatomy} {easings.anatomy}';
const planeTransition = [
  `top ${anatomyMove}`,
  `left ${anatomyMove}`,
  `transform ${anatomyMove}`,
  'opacity 200ms ease',
  'background-color 300ms ease',
  'outline-color 300ms ease',
].join(', ');

/** Fades the labels; `visibility` takes them out of the tab order once they've gone. */
const fade = (visible: boolean): SystemStyleObject => ({
  opacity: visible ? 1 : 0,
  visibility: visible ? 'visible' : 'hidden',
  transition: 'opacity 200ms ease, visibility 200ms',
  _motionReduce: { transition: 'none' },
});

const desktopOnly = { base: 'none', md: 'block' } as const;
const phoneOnly = { base: 'block', md: 'none' } as const;

/** Descriptions are one line of Markdown that may hold inline code. */
function Description({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((chunk, index) =>
        index % 2 === 1 ? (
          <chakra.code
            key={index}
            fontFamily="mono"
            fontSize="12px"
            whiteSpace="nowrap"
          >
            {chunk}
          </chakra.code>
        ) : (
          <Fragment key={index}>{chunk}</Fragment>
        ),
      )}
    </>
  );
}

function NumberBadge({ value, size }: { value: number; size: 18 | 20 }) {
  return (
    <chakra.span
      aria-hidden="true"
      display="flex"
      flex="0 0 auto"
      alignItems="center"
      justifyContent="center"
      width={`${size}px`}
      height={`${size}px`}
      borderRadius="full"
      bg="bg.inverted"
      color="fg.inverted"
      fontSize={size === 18 ? '10.5px' : '2xs'}
      fontWeight="medium"
      lineHeight="1"
    >
      {value}
    </chakra.span>
  );
}

const resetButton: SystemStyleObject = {
  display: 'block',
  width: '100%',
  margin: 0,
  padding: 0,
  border: 0,
  bg: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'start',
  cursor: 'default',
  borderRadius: 'xs',
};

interface PlanesProps {
  readonly layout: AnatomyLayout;
  readonly exploded: boolean;
  readonly active: number | null;
  /** Phones: the numbers grow back toward a readable size as the diagram shrinks. */
  readonly badgeScale: number;
  /** The live component, drawn on the root plane (see `ExplodedViewProps.preview`). */
  readonly preview?: ReactNode;
}

/** Exploded, the live component shows this faintly on the root plane (as the boards draw it). */
const PREVIEW_EXPLODED_OPACITY = 0.3;

/** The skewed planes, guides, connectors and phone numbers. Decorative: the labels carry it. */
function Planes({
  layout,
  exploded,
  active,
  badgeScale,
  preview,
}: PlanesProps) {
  const { stage, planes, plane, planeLeft, elbowX, labelLeft } = layout;
  const count = planes.length;

  return (
    <Box aria-hidden="true" position="absolute" inset="0">
      <chakra.svg
        width={stage.width}
        height={stage.height}
        position="absolute"
        left="0"
        top="0"
        zIndex="0"
        color="fg"
        overflow="visible"
        display={desktopOnly}
        css={fade(exploded)}
      >
        {layout.guides.map((guide, index) => (
          <line
            key={index}
            x1={guide.x}
            y1={guide.y1}
            x2={guide.x}
            y2={guide.y2}
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeDasharray="3 4"
          />
        ))}
      </chakra.svg>

      {planes.map(({ index, layer, isRoot, top }) => {
        const isolated = active === index;
        const dimmed = exploded && active !== null && !isolated;
        // Assembled, the live component is the root plane's surface: no card behind it.
        const showsComponent = isRoot && preview != null && !exploded;
        return (
          <chakra.div
            key={layer.part}
            data-anatomy-layer={layer.part}
            data-isolated={isolated ? '' : undefined}
            position="absolute"
            width={`${plane.width}px`}
            height={`${plane.height}px`}
            transformOrigin="0 0"
            borderRadius="lg"
            zIndex={count - index}
            style={{
              left: exploded ? `${planeLeft}px` : undefined,
              top: exploded ? `${top}px` : undefined,
              transform: exploded ? PLANE_TRANSFORM : 'none',
            }}
            css={{
              // Assembled, every plane rests on the same spot: centred in the stage.
              left: {
                base: 'var(--anatomy-rest-left-phone)',
                md: 'var(--anatomy-rest-left)',
              },
              top: {
                base: 'var(--anatomy-rest-top-phone)',
                md: 'var(--anatomy-rest-top)',
              },
              opacity: dimmed ? 0.15 : 1,
              bg: showsComponent
                ? 'transparent'
                : isRoot
                  ? 'bg.raised'
                  : exploded
                    ? 'bg.raised/50'
                    : 'transparent',
              outlineStyle: isolated ? 'solid' : isRoot ? 'solid' : 'dashed',
              outlineWidth: isolated ? '1.5px' : '1px',
              outlineColor: isolated
                ? 'fg'
                : showsComponent
                  ? 'transparent'
                  : isRoot
                    ? 'border'
                    : exploded
                      ? 'border.faint'
                      : 'transparent',
              transition: planeTransition,
              _motionReduce: { transition: 'none' },
            }}
          >
            {isRoot && preview != null ? (
              <chakra.div
                data-anatomy-preview=""
                aria-hidden="true"
                inert
                position="absolute"
                inset="0"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                pointerEvents="none"
                userSelect="none"
                css={{
                  opacity: exploded ? PREVIEW_EXPLODED_OPACITY : 1,
                  transition: 'opacity 300ms ease',
                  _motionReduce: { transition: 'none' },
                  // The component fills the box's width at its natural height (centred, never
                  // squeezed to the plane), with no outer margin.
                  '& > *': {
                    width: '100%',
                    flexShrink: 0,
                    marginBlock: '0 !important',
                  },
                }}
              >
                {preview}
              </chakra.div>
            ) : null}
            {!isRoot ? (
              <chakra.span
                position="absolute"
                boxSizing="border-box"
                borderRadius="6px"
                border="1.5px solid"
                borderColor="fg"
                style={{
                  left: `${layer.box.x}px`,
                  top: `${layer.box.y}px`,
                  width: `${layer.box.w}px`,
                  height: `${layer.box.h}px`,
                }}
                css={{
                  // Assembled, only the isolated part keeps its outline.
                  opacity: exploded || isolated ? 1 : 0,
                  transition: 'opacity 200ms ease',
                  _motionReduce: { transition: 'none' },
                }}
              />
            ) : null}
          </chakra.div>
        );
      })}

      <chakra.svg
        width={stage.width}
        height={stage.height}
        viewBox={`0 0 ${stage.width} ${stage.height}`}
        position="absolute"
        left="0"
        top="0"
        zIndex="30"
        color="fg"
        overflow="visible"
        display={desktopOnly}
        css={fade(exploded)}
      >
        {planes.map(({ layer, dot, labelY }) => (
          <Fragment key={layer.part}>
            <path
              d={`M${dot.x} ${dot.y} L${elbowX} ${labelY} L${labelLeft - 10} ${labelY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
            <circle cx={dot.x} cy={dot.y} r="3.5" fill="currentColor" />
          </Fragment>
        ))}
      </chakra.svg>

      {/* Phones: each label becomes its number, beside the part (the legend follows). */}
      {planes.map(({ index, layer, dot }) => (
        <chakra.span
          key={layer.part}
          position="absolute"
          zIndex="40"
          display={{ base: 'block', md: 'none' }}
          transformOrigin="left bottom"
          style={{
            left: `${Math.round(dot.x + 6)}px`,
            top: `${Math.round(dot.y - 21.5)}px`,
            transform: badgeScale === 1 ? undefined : `scale(${badgeScale})`,
          }}
          css={fade(exploded)}
        >
          <NumberBadge value={index + 1} size={20} />
        </chakra.span>
      ))}
    </Box>
  );
}

export interface ExplodedViewProps {
  readonly componentName: string;
  readonly layers: readonly ComponentAnatomyLayer[];
  /**
   * The live component (`AnatomyDiagram`'s `preview`). Drawn flat at the root layer's box
   * when assembled, and faintly on the root (bottom) plane when exploded. Illustrative only:
   * it's `aria-hidden` and `inert`.
   */
  readonly preview?: ReactNode;
}

/**
 * The exploded anatomy diagram (01 §6.3, PK-034): skewed planes, numbered labels that
 * isolate their layer on hover or focus, the Assemble/Explode toggle, and on phones the
 * numbers and legend.
 */
export function ExplodedView({
  componentName,
  layers,
  preview,
}: ExplodedViewProps) {
  const [view, setView] = useState<View>('exploded');
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [labelHeights, setLabelHeights] = useState<number[] | null>(null);
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLLIElement | null)[]>([]);

  const layout = useMemo(
    () => computeAnatomyLayout(layers, labelHeights),
    [layers, labelHeights],
  );
  const exploded = view === 'exploded';
  const active = hovered ?? focused;
  const count = layers.length;
  const name = `${componentName}’s ${count} ${count === 1 ? 'part' : 'parts'}`;

  // Labels are laid out from estimates on the server; once the fonts are in, use their real
  // heights so no label crowds the next. Hidden labels (phones) measure 0 and keep estimates.
  const measureLabels = useCallback(() => {
    const heights = labelRefs.current.map((node) => node?.offsetHeight ?? 0);
    if (heights.some((height) => height === 0)) return;
    setLabelHeights((current) =>
      current &&
      current.length === heights.length &&
      current.every((height, index) => Math.abs(height - heights[index]) < 1)
        ? current
        : heights,
    );
  }, []);

  const { stage, phoneStage } = layout;

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const phone = window.matchMedia(PHONE_QUERY);

    const update = () => {
      const base = phone.matches ? phoneStage.width : stage.width;
      setScale(Math.min(1, frame.clientWidth / base));
      measureLabels();
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    // Labels change height when the web fonts swap in, or when they're first displayed.
    const labelObserver = new ResizeObserver(measureLabels);
    labelRefs.current.forEach((node) => node && labelObserver.observe(node));
    phone.addEventListener('change', update);
    return () => {
      observer.disconnect();
      labelObserver.disconnect();
      phone.removeEventListener('change', update);
    };
  }, [measureLabels, phoneStage.width, stage.width]);

  const frameVars = {
    '--anatomy-w': `${stage.width}px`,
    '--anatomy-h': `${stage.height}px`,
    '--anatomy-ratio': `${stage.width} / ${stage.height}`,
    '--anatomy-phone-w': `${phoneStage.width}px`,
    '--anatomy-phone-h': `${phoneStage.height}px`,
    '--anatomy-phone-ratio': `${phoneStage.width} / ${phoneStage.height}`,
    '--anatomy-rest-left': `${layout.assembled.stage.left}px`,
    '--anatomy-rest-top': `${layout.assembled.stage.top}px`,
    '--anatomy-rest-left-phone': `${layout.assembled.phoneStage.left}px`,
    '--anatomy-rest-top-phone': `${layout.assembled.phoneStage.top}px`,
  } as CSSProperties;

  const isolateHandlers = (index: number) => ({
    onMouseEnter: () => setHovered(index),
    onMouseLeave: () => setHovered(null),
    onFocus: () => setFocused(index),
    onBlur: () => setFocused(null),
  });

  return (
    <chakra.figure
      aria-label={`Exploded view of ${name}`}
      data-anatomy-view={view}
      position="relative"
      margin="0"
      borderRadius="24px"
      bg="bg.subtle"
      padding="clamp(20px, 4vw, 36px)"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="16px"
        insetInlineEnd="16px"
        zIndex="50"
        css={segmentedOnSubtle}
      >
        <SegmentedControl
          aria-label={`${componentName} anatomy view`}
          items={VIEW_ITEMS}
          value={view}
          onValueChange={setView}
        />
      </Box>

      <Box
        ref={frameRef}
        position="relative"
        // Desktop: like the boards, the labels may run into the figure's end padding.
        marginInlineEnd={{
          base: '0',
          md: 'calc(8px - clamp(20px, 4vw, 36px))',
        }}
        maxWidth={{ base: 'var(--anatomy-phone-w)', md: 'var(--anatomy-w)' }}
        aspectRatio={{
          base: 'var(--anatomy-phone-ratio)',
          md: 'var(--anatomy-ratio)',
        }}
        style={frameVars}
      >
        <Box
          position="absolute"
          left="0"
          top="0"
          width={{ base: 'var(--anatomy-phone-w)', md: 'var(--anatomy-w)' }}
          height={{ base: 'var(--anatomy-phone-h)', md: 'var(--anatomy-h)' }}
          transformOrigin="0 0"
          style={{ transform: scale === 1 ? undefined : `scale(${scale})` }}
        >
          <Planes
            layout={layout}
            exploded={exploded}
            active={active}
            badgeScale={Math.min(1.7, Math.max(1, 0.8 / scale))}
            preview={preview}
          />

          <chakra.ol
            aria-label={`${componentName} parts, top to bottom`}
            position="absolute"
            inset="0"
            zIndex="40"
            margin="0"
            padding="0"
            listStyleType="none"
            pointerEvents="none"
            display={desktopOnly}
          >
            {layout.planes.map(({ index, layer, labelTop }) => (
              <chakra.li
                key={layer.part}
                ref={(node: HTMLLIElement | null) => {
                  labelRefs.current[index] = node;
                }}
                position="absolute"
                pointerEvents="auto"
                style={{
                  left: `${layout.labelLeft}px`,
                  top: `${labelTop}px`,
                  width: `${LABEL_WIDTH}px`,
                }}
                css={fade(exploded)}
              >
                <chakra.button
                  type="button"
                  data-anatomy-label={layer.part}
                  css={resetButton}
                  {...isolateHandlers(index)}
                >
                  <chakra.span display="flex" alignItems="baseline" gap="8px">
                    <chakra.span alignSelf="center" display="flex">
                      <NumberBadge value={index + 1} size={18} />
                    </chakra.span>
                    <chakra.span
                      fontFamily="mono"
                      fontSize="13.5px"
                      fontWeight="medium"
                      color="fg"
                    >
                      {layer.part}
                    </chakra.span>
                    <chakra.span
                      fontFamily="mono"
                      fontSize="xs"
                      color="fg.quiet"
                    >
                      {`<${layer.element}>`}
                    </chakra.span>
                  </chakra.span>
                  <chakra.span
                    display="block"
                    marginTop="3px"
                    marginInlineStart="26px"
                    fontSize="13.5px"
                    lineHeight="1.45"
                    color="fg.muted"
                  >
                    <Description text={layer.description} />
                  </chakra.span>
                </chakra.button>
              </chakra.li>
            ))}
          </chakra.ol>
        </Box>
      </Box>

      <chakra.ol
        aria-label={`${componentName} parts, top to bottom`}
        display={phoneOnly}
        margin="16px 0 0"
        padding="0"
        listStyleType="none"
      >
        {layers.map((layer, index) => (
          <chakra.li
            key={layer.part}
            borderTop="1px solid"
            borderColor="border"
          >
            <chakra.button
              type="button"
              data-anatomy-legend={layer.part}
              css={{
                ...resetButton,
                display: 'grid',
                gridTemplateColumns: '28px 1fr',
                paddingBlock: '10px',
              }}
              {...isolateHandlers(index)}
            >
              <NumberBadge value={index + 1} size={20} />
              <chakra.span minWidth="0">
                <chakra.span
                  fontFamily="mono"
                  fontSize="13.5px"
                  fontWeight="medium"
                  color="fg"
                >
                  {layer.part}
                </chakra.span>
                <chakra.span display="block" fontSize="14px" color="fg.muted">
                  <Description text={layer.description} />
                </chakra.span>
              </chakra.span>
            </chakra.button>
          </chakra.li>
        ))}
      </chakra.ol>

      <chakra.figcaption marginTop="14px" fontSize="13.5px" color="fg.muted">
        Each layer is one{' '}
        <chakra.code fontFamily="mono" fontSize="12.5px">
          data-postkit-part
        </chakra.code>
        , outlined where it sits.
        <chakra.span
          display={{ base: 'none', md: 'inline' }}
          css={fade(exploded)}
        >
          {' '}
          Point at a label to isolate its layer, or assemble it back into the
          component.
        </chakra.span>
      </chakra.figcaption>
    </chakra.figure>
  );
}
