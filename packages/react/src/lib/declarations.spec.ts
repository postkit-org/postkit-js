import {
  POSTKIT_DECLARATION_VERSION,
  postkitDeclarationFor,
  postkitDeclarationManifest,
} from './declarations.js';

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
});
