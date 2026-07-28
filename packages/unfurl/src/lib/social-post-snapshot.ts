import type {
  LinkResolverId,
  ResolvedLinkCache,
  ResolvedLinkPreview,
} from './types.js';

export const POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export interface PostkitSocialPostSnapshot {
  readonly schemaVersion: typeof POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION;
  /**
   * The instant an authoring tool committed this resolver result to source.
   */
  readonly capturedAt: string;
  /**
   * The instant the resolver fetched the underlying data, when available.
   * This can predate `capturedAt` when the resolver returned a cached result.
   */
  readonly resolvedAt?: string;
  readonly cacheStrategy?: ResolvedLinkCache['strategy'];
  readonly cacheResult?: ResolvedLinkCache['result'];
  readonly resolver: {
    readonly id: LinkResolverId;
  };
  readonly metadata: ResolvedLinkPreview;
}

export interface CreatePostkitSocialPostSnapshotOptions {
  readonly capturedAt?: string;
  readonly resolvedAt?: string;
  readonly cacheStrategy?: ResolvedLinkCache['strategy'];
  readonly cacheResult?: ResolvedLinkCache['result'];
  readonly resolverId?: LinkResolverId;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function validTimestamp(value: string, label: string) {
  if (Number.isNaN(Date.parse(value))) {
    throw new TypeError(
      `Postkit social snapshot ${label} must be an ISO date.`,
    );
  }
  return value;
}

export function createPostkitSocialPostSnapshot(
  metadata: ResolvedLinkPreview,
  options: CreatePostkitSocialPostSnapshotOptions = {},
): PostkitSocialPostSnapshot {
  const capturedAt = validTimestamp(
    options.capturedAt ?? new Date().toISOString(),
    'capturedAt',
  );
  const resolvedAt = options.resolvedAt ?? metadata.cache?.fetchedAt;
  if (resolvedAt) validTimestamp(resolvedAt, 'resolvedAt');
  const cacheStrategy = options.cacheStrategy ?? metadata.cache?.strategy;
  const cacheResult = options.cacheResult ?? metadata.cache?.result;

  return Object.freeze({
    schemaVersion: POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION,
    capturedAt,
    ...(resolvedAt ? { resolvedAt } : {}),
    ...(cacheStrategy ? { cacheStrategy } : {}),
    ...(cacheResult ? { cacheResult } : {}),
    resolver: Object.freeze({
      id: options.resolverId ?? metadata.provider.id,
    }),
    metadata,
  });
}

export function isPostkitSocialPostSnapshot(
  value: unknown,
): value is PostkitSocialPostSnapshot {
  if (!isRecord(value) || !isRecord(value.resolver)) return false;
  const metadata = value.metadata;
  return (
    value.schemaVersion === POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION &&
    typeof value.capturedAt === 'string' &&
    !Number.isNaN(Date.parse(value.capturedAt)) &&
    (value.resolvedAt === undefined ||
      (typeof value.resolvedAt === 'string' &&
        !Number.isNaN(Date.parse(value.resolvedAt)))) &&
    (value.cacheStrategy === undefined ||
      value.cacheStrategy === 'use' ||
      value.cacheStrategy === 'refresh' ||
      value.cacheStrategy === 'bypass') &&
    (value.cacheResult === undefined ||
      value.cacheResult === 'hit' ||
      value.cacheResult === 'miss' ||
      value.cacheResult === 'stale' ||
      value.cacheResult === 'unavailable') &&
    typeof value.resolver.id === 'string' &&
    value.resolver.id.length > 0 &&
    isRecord(metadata) &&
    typeof metadata.requestedUrl === 'string' &&
    typeof metadata.url === 'string' &&
    isRecord(metadata.provider) &&
    typeof metadata.provider.id === 'string' &&
    Array.isArray(metadata.images) &&
    Array.isArray(metadata.audio) &&
    Array.isArray(metadata.video)
  );
}
