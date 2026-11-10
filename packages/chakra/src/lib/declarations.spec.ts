import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { postkitBuiltInDefinitions } from '@postkit/core/components';
import { expectTypeOf } from 'vitest';
import {
  POSTKIT_DECLARATION_VERSION,
  postkitDeclarationFor,
  postkitDeclarationFromDefinition,
  postkitDeclarationManifest,
  postkitPresentationProps,
  type PostkitComponentDeclaration,
  type PostkitComponentName,
} from './declarations.js';

/** The declarations exactly as the hand-written 0.2 code produced them. */
const snapshot = JSON.parse(
  readFileSync(
    join(__dirname, 'testing', 'declarations-0.2.snapshot.json'),
    'utf8',
  ),
) as {
  readonly presentationProps: unknown;
  readonly manifest: { readonly components: Record<string, unknown> };
};

describe('Postkit declaration manifest', () => {
  it('publishes stable names and directives for the initial article components', () => {
    expect(POSTKIT_DECLARATION_VERSION).toBe(7);
    expect(postkitDeclarationManifest.id).toBe('postkit.article');
    expect(
      Object.values(postkitDeclarationManifest.components).map(
        ({ name, directive }) => [name, directive],
      ),
    ).toEqual([
      ['Aside', 'postkit-aside'],
      ['Callout', 'postkit-callout'],
      ['CardGrid', 'postkit-card-grid'],
      ['Disclosure', 'postkit-disclosure'],
      ['Gallery', 'postkit-gallery'],
      ['Steps', 'postkit-steps'],
      ['Tabs', 'postkit-tabs'],
      ['CodeBlock', 'postkit-code-block'],
      ['CodeGroup', 'postkit-code-group'],
      ['Diff', 'postkit-diff'],
      ['FileCard', 'postkit-file-card'],
      ['FileTree', 'postkit-file-tree'],
      ['Terminal', 'postkit-terminal'],
      ['AudienceBoundary', 'postkit-audience-boundary'],
      ['Comparison', 'postkit-comparison'],
      ['KeyTakeaway', 'postkit-key-takeaway'],
      ['Poll', 'postkit-poll'],
      ['ProductCard', 'postkit-product-card'],
      ['PullQuote', 'postkit-pull-quote'],
      ['RelatedContent', 'postkit-related-content'],
      ['SeriesNavigation', 'postkit-series-navigation'],
      ['SponsorBlock', 'postkit-sponsor-block'],
      ['Stat', 'postkit-stat'],
      ['AppearsOn', 'postkit-appears-on'],
      ['Audio', 'postkit-audio'],
      ['AuthorCard', 'postkit-author-card'],
      ['CallToAction', 'postkit-call-to-action'],
      ['Carousel', 'postkit-carousel'],
      ['Chart', 'postkit-chart'],
      ['Figure', 'postkit-figure'],
      ['LinkPreview', 'postkit-link-preview'],
      ['NewsletterSignup', 'postkit-newsletter-signup'],
      ['ShareActions', 'postkit-share-actions'],
      ['SocialPost', 'postkit-social-post'],
      ['Video', 'postkit-video'],
    ]);
  });

  it('exposes required authoring props to renderers and editor integrations', () => {
    expect(postkitDeclarationFor('Video').props.src.required).toBe(true);
    expect(postkitDeclarationFor('Poll').props.options.kind).toBe('json');
    expect(postkitDeclarationFor('Poll').props).not.toHaveProperty('onVote');
    expect(postkitDeclarationFor('AudienceBoundary').props).not.toHaveProperty(
      'authorized',
    );
    expect(postkitDeclarationFor('ProductCard').props.href.required).toBe(true);
    expect(postkitDeclarationFor('Comparison').props.columns.required).toBe(
      true,
    );
    expect(postkitDeclarationFor('CodeBlock').props.code.required).toBe(true);
    expect(postkitDeclarationFor('CodeGroup').props.items.kind).toBe('json');
    expect(postkitDeclarationFor('Diff').props.diff.required).toBe(true);
    expect(postkitDeclarationFor('FileCard').props.href.required).toBe(true);
    expect(postkitDeclarationFor('Callout').props.tone.values).toEqual([
      'note',
      'tip',
      'important',
      'warning',
      'caution',
    ]);
    expect(postkitDeclarationFor('Gallery').props.items.required).toBe(true);
    expect(postkitDeclarationFor('Disclosure').childMode).toBe('mdx');
    expect(postkitDeclarationFor('Tabs').props.initialIndex.kind).toBe(
      'number',
    );
    expect(postkitDeclarationFor('Video').props.title.required).toBe(true);
    expect(postkitDeclarationFor('Chart').props.data.kind).toBe('json');
    expect(postkitDeclarationFor('Chart').props.variant.values).toEqual([
      'outline',
      'subtle',
      'plain',
    ]);
    expect(postkitDeclarationFor('Figure').props.alt.required).toBe(true);
    expect(postkitDeclarationFor('Figure').props.layout.values).toEqual([
      'inline',
      'wide',
      'bleed',
    ]);
    expect(postkitDeclarationFor('LinkPreview').props.href.required).toBe(true);
    expect(
      postkitDeclarationFor('LinkPreview').props.presentation.values,
    ).toEqual(['inline', 'card', 'embed', 'media', 'auto']);
    expect(postkitDeclarationFor('LinkPreview').props.metadata.kind).toBe(
      'json',
    );
    expect(postkitDeclarationFor('AppearsOn').props.items.required).toBe(true);
    expect(postkitDeclarationFor('ShareActions').props.services.kind).toBe(
      'json',
    );
    expect(postkitDeclarationFor('SocialPost').props.branding.values).toEqual([
      'none',
      'subtle',
      'full',
    ]);
    expect(postkitDeclarationFor('SocialPost').props.resolution.values).toEqual(
      ['live', 'snapshot', 'snapshot-fallback'],
    );
    expect(
      postkitDeclarationFor('SocialPost').props.snapshotInfo.values,
    ).toEqual(['auto', 'visible', 'hidden']);
    expect(postkitDeclarationFor('Carousel').childMode).toBe('mdx');
    expect(postkitDeclarationFor('AuthorCard').props.name.required).toBe(true);
    expect(postkitDeclarationFor('AuthorCard').props.links.kind).toBe('json');
    expect(
      postkitDeclarationFor('CallToAction').props.alignment.values,
    ).toEqual(['start', 'center']);
    expect(postkitDeclarationFor('NewsletterSignup').props).not.toHaveProperty(
      'action',
    );
    expect(postkitDeclarationFor('NewsletterSignup').childMode).toBe('mdx');
    expect(postkitDeclarationFor('Carousel').directiveRemarkPlugins).toEqual([
      'directives',
      'postkit',
    ]);
  });

  it('builds every declaration from its definition, identical to 0.2', () => {
    const definitions = Object.entries(postkitBuiltInDefinitions);
    expect(definitions.map(([name]) => name)).toEqual(
      Object.keys(snapshot.manifest.components),
    );
    for (const [name, definition] of definitions) {
      const declaration = postkitDeclarationFromDefinition(definition);
      expect(declaration).toStrictEqual(snapshot.manifest.components[name]);
      // Key order reaches the generated manifest, so compare it too.
      expect(JSON.stringify(declaration)).toBe(
        JSON.stringify(snapshot.manifest.components[name]),
      );
    }
    expect(JSON.parse(JSON.stringify(postkitDeclarationManifest))).toEqual(
      snapshot.manifest,
    );
    expect(JSON.stringify(postkitDeclarationManifest)).toBe(
      JSON.stringify(snapshot.manifest),
    );
    expect(JSON.stringify(postkitPresentationProps)).toBe(
      JSON.stringify(snapshot.presentationProps),
    );
    expect(Object.isFrozen(postkitDeclarationManifest)).toBe(true);
  });

  it('keeps the 0.2 public types', () => {
    expectTypeOf<PostkitComponentName>().toEqualTypeOf<
      | 'AppearsOn'
      | 'AudienceBoundary'
      | 'Aside'
      | 'Audio'
      | 'AuthorCard'
      | 'Callout'
      | 'CallToAction'
      | 'CardGrid'
      | 'Carousel'
      | 'Chart'
      | 'CodeBlock'
      | 'CodeGroup'
      | 'Comparison'
      | 'Diff'
      | 'Disclosure'
      | 'Figure'
      | 'FileCard'
      | 'FileTree'
      | 'Gallery'
      | 'KeyTakeaway'
      | 'LinkPreview'
      | 'NewsletterSignup'
      | 'Poll'
      | 'ProductCard'
      | 'PullQuote'
      | 'RelatedContent'
      | 'ShareActions'
      | 'SeriesNavigation'
      | 'SocialPost'
      | 'Steps'
      | 'SponsorBlock'
      | 'Stat'
      | 'Tabs'
      | 'Terminal'
      | 'Video'
    >();
    const { components } = postkitDeclarationManifest;
    expectTypeOf(components.Callout.name).toEqualTypeOf<'Callout'>();
    expectTypeOf(components.Callout.childMode).toEqualTypeOf<'mdx'>();
    expectTypeOf(components.Callout.props.tone.kind).toEqualTypeOf<'enum'>();
    expectTypeOf(components.Callout.props.tone.values).toEqualTypeOf<
      string[]
    >();
    expectTypeOf(components.Video.props.src.required).toEqualTypeOf<true>();
    expectTypeOf(components.Poll.props.question.kind).toEqualTypeOf<'string'>();
    expectTypeOf(components.Poll).toExtend<PostkitComponentDeclaration>();
    expectTypeOf(postkitPresentationProps.size.values).toEqualTypeOf<
      string[]
    >();
    expectTypeOf(postkitPresentationProps.size.kind).toEqualTypeOf<'enum'>();
  });
});
