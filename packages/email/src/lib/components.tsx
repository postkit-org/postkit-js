import {
  Button,
  Heading,
  Img,
  Link,
  Section,
  Stack,
  Text,
  type ChakraEmailStyleProps,
} from '@chakra-email/core';
import type { ReactNode } from 'react';

import {
  createPostkitEmailAction,
  createPostkitEmailMediaModel,
  numericEmailDimension,
} from './models.js';

export type Tone =
  | 'note'
  | 'tip'
  | 'important'
  | 'warning'
  | 'caution';

const toneStyles: Record<
  Tone,
  Pick<ChakraEmailStyleProps, 'bg' | 'borderColor' | 'color'>
> = {
  note: { bg: 'blue.50', borderColor: 'blue.500', color: 'blue.900' },
  tip: { bg: 'green.50', borderColor: 'green.500', color: 'green.900' },
  important: {
    bg: 'purple.50',
    borderColor: 'purple.500',
    color: 'purple.900',
  },
  warning: {
    bg: 'yellow.50',
    borderColor: 'yellow.500',
    color: 'yellow.900',
  },
  caution: { bg: 'red.50', borderColor: 'red.500', color: 'red.900' },
};

export interface CalloutProps {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly tone?: Tone;
  readonly rootStyles?: ChakraEmailStyleProps;
  readonly componentName?: 'Aside' | 'Callout';
}

export function Callout({
  title,
  children,
  tone = 'note',
  rootStyles,
  componentName = 'Callout',
}: CalloutProps) {
  return (
    <Section
      aria-label={title || tone}
      data-postkit-component={componentName}
      data-postkit-tone={tone}
      borderLeft="4px solid"
      p={4}
      mb={4}
      {...toneStyles[tone]}
      {...rootStyles}
    >
      {title ? (
        <Text fontWeight="bold" color="inherit" mb={2}>
          {title}
        </Text>
      ) : null}
      <Text as="div" color="inherit" mb={0}>
        {children}
      </Text>
    </Section>
  );
}

export type AsideProps = Omit<
  CalloutProps,
  'componentName'
>;

export function Aside(props: AsideProps) {
  return <Callout {...props} componentName="Aside" />;
}

export interface CallToActionProps {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly primaryLabel?: string;
  readonly primaryHref?: string;
  readonly secondaryLabel?: string;
  readonly secondaryHref?: string;
  readonly children?: ReactNode;
  readonly rootStyles?: ChakraEmailStyleProps;
}

export function CallToAction({
  title,
  eyebrow,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  children,
  rootStyles,
}: CallToActionProps) {
  const primary = createPostkitEmailAction(primaryLabel, primaryHref);
  const secondary = createPostkitEmailAction(secondaryLabel, secondaryHref);
  return (
    <Section
      data-postkit-component="CallToAction"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      rounded="lg"
      p={6}
      mb={4}
      {...rootStyles}
    >
      {eyebrow ? (
        <Text
          color="gray.600"
          fontSize="sm"
          fontWeight="bold"
          textTransform="uppercase"
          mb={2}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Heading as="h2" mb={3}>
        {title}
      </Heading>
      {children || description ? (
        <Text as="div" color="gray.700" mb={4}>
          {children ?? description}
        </Text>
      ) : null}
      {primary || secondary ? (
        <Stack spacing={3}>
          {primary ? (
            <Button href={primary.href} variant="solid">
              {primary.label}
            </Button>
          ) : null}
          {secondary ? (
            <Link href={secondary.href}>{secondary.label}</Link>
          ) : null}
        </Stack>
      ) : null}
    </Section>
  );
}

export interface FigureProps {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly credit?: string;
  readonly creditHref?: string;
  readonly href?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

export function Figure({
  src,
  alt,
  caption,
  credit,
  creditHref,
  href,
  width,
  height,
  rootStyles,
}: FigureProps) {
  const image = (
    <Img
      src={src}
      alt={alt}
      width={numericEmailDimension(width) ?? '100%'}
      height={numericEmailDimension(height)}
      maxW="full"
    />
  );
  return (
    <Section
      data-postkit-component="Figure"
      mb={4}
      {...rootStyles}
    >
      {href ? <Link href={href}>{image}</Link> : image}
      {caption ? (
        <Text color="gray.700" fontSize="sm" mt={2} mb={0}>
          {caption}
        </Text>
      ) : null}
      {credit ? (
        <Text color="gray.600" fontSize="xs" mt={1} mb={0}>
          {creditHref ? <Link href={creditHref}>{credit}</Link> : credit}
        </Text>
      ) : null}
    </Section>
  );
}

export interface AudioProps {
  readonly src: string;
  readonly title: string;
  readonly caption?: string;
  readonly actionLabel?: string;
  readonly rootStyles?: ChakraEmailStyleProps;
}

export function Audio({
  src,
  title,
  caption,
  actionLabel = 'Listen to audio',
  rootStyles,
}: AudioProps) {
  const model = createPostkitEmailMediaModel({
    src,
    title,
    caption,
    actionLabel,
  });
  return (
    <Section
      data-postkit-component="Audio"
      border="1px solid"
      borderColor="gray.200"
      rounded="lg"
      p={4}
      mb={4}
      {...rootStyles}
    >
      <Heading as="h3" fontSize="lg" mb={2}>
        {model.title}
      </Heading>
      {model.caption ? (
        <Text color="gray.700" mb={3}>
          {model.caption}
        </Text>
      ) : null}
      <Button href={model.action.href}>{model.action.label}</Button>
    </Section>
  );
}

export interface VideoProps extends AudioProps {
  readonly poster?: string;
}

export function Video({
  src,
  title,
  caption,
  poster,
  actionLabel = 'Watch video',
  rootStyles,
}: VideoProps) {
  const model = createPostkitEmailMediaModel({
    src,
    title,
    caption,
    poster,
    actionLabel,
  });
  return (
    <Section
      data-postkit-component="Video"
      border="1px solid"
      borderColor="gray.200"
      rounded="lg"
      p={4}
      mb={4}
      {...rootStyles}
    >
      {model.poster ? (
        <Link href={model.action.href} aria-label={model.action.label}>
          <Img src={model.poster} alt="" width="100%" maxW="full" mb={3} />
        </Link>
      ) : null}
      <Heading as="h3" fontSize="lg" mb={2}>
        {model.title}
      </Heading>
      {model.caption ? (
        <Text color="gray.700" mb={3}>
          {model.caption}
        </Text>
      ) : null}
      <Button href={model.action.href}>{model.action.label}</Button>
    </Section>
  );
}
