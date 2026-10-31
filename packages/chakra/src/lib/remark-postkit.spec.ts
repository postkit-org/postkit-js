import {
  isPostkitComponentName,
  remarkPostkit,
  type PostkitDirectiveNode,
} from './remark-postkit.js';

function rootWith(child: PostkitDirectiveNode): PostkitDirectiveNode {
  return { type: 'root', children: [child] };
}

describe('remarkPostkit', () => {
  it('turns a Postkit directive into an MDX component with literal props', () => {
    const tree = rootWith({
      type: 'leafDirective',
      name: 'postkit-video',
      attributes: {
        src: '/media/interview.mp4',
        title: 'Interview',
        preload: 'metadata',
      },
    });

    remarkPostkit()(tree);

    expect(tree.children?.[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'Video',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'src',
          value: '/media/interview.mp4',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'title',
          value: 'Interview',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'preload',
          value: 'metadata',
        },
      ],
      children: [],
    });
  });

  it('preserves Markdown children in a container carousel', () => {
    const paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'First slide' }],
    };
    const tree = rootWith({
      type: 'containerDirective',
      name: 'postkit-carousel',
      attributes: { label: 'Highlights' },
      children: [paragraph],
    });

    remarkPostkit()(tree);

    expect(tree.children?.[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'Carousel',
      children: [paragraph],
    });
  });

  it('preserves Markdown children in standard article blocks', () => {
    const paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'Portable supporting copy.' }],
    };
    const tree: PostkitDirectiveNode = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'postkit-author-card',
          attributes: { name: 'Ada Lovelace' },
          children: [paragraph],
        },
        {
          type: 'containerDirective',
          name: 'postkit-call-to-action',
          attributes: { title: 'Open the guide' },
          children: [paragraph],
        },
        {
          type: 'containerDirective',
          name: 'postkit-newsletter-signup',
          attributes: { title: 'Get field notes', list: 'weekly' },
          children: [paragraph],
        },
      ],
    };

    remarkPostkit()(tree);

    expect(tree.children?.map((child) => child.name)).toEqual([
      'AuthorCard',
      'CallToAction',
      'NewsletterSignup',
    ]);
    expect(
      tree.children?.every((child) => child.children?.[0] === paragraph),
    ).toBe(true);
  });

  it('supports HAST component annotations and boolean attributes', () => {
    const tree = rootWith({
      type: 'leafDirective',
      name: 'chart',
      attributes: {
        title: 'Revenue',
        data: '[{"label":"Q1","value":12}]',
        showTable: null,
      },
    });

    remarkPostkit({ output: 'hast' })(tree);

    expect(tree.children?.[0]?.data).toMatchObject({
      hName: 'Chart',
      hProperties: {
        title: 'Revenue',
        data: '[{"label":"Q1","value":12}]',
        showTable: true,
      },
    });
  });

  it('supports figures with explicitly empty decorative alt text', () => {
    const tree = rootWith({
      type: 'leafDirective',
      name: 'postkit-figure',
      attributes: {
        src: '/texture.jpg',
        alt: '',
        caption: 'A decorative paper texture.',
        layout: 'wide',
      },
    });

    remarkPostkit()(tree);

    expect(tree.children?.[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'Figure',
      attributes: expect.arrayContaining([
        { type: 'mdxJsxAttribute', name: 'src', value: '/texture.jpg' },
        { type: 'mdxJsxAttribute', name: 'alt', value: '' },
        { type: 'mdxJsxAttribute', name: 'layout', value: 'wide' },
      ]),
    });
  });

  it('turns a link preview directive into a provider-hinted card', () => {
    const tree = rootWith({
      type: 'leafDirective',
      name: 'postkit-link-preview',
      attributes: {
        href: 'https://example.com/article',
        provider: 'microlink',
        presentation: 'card',
        size: 'lg',
        images: 'carousel',
      },
    });

    remarkPostkit()(tree);

    expect(tree.children?.[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'LinkPreview',
      attributes: expect.arrayContaining([
        {
          type: 'mdxJsxAttribute',
          name: 'href',
          value: 'https://example.com/article',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'provider',
          value: 'microlink',
        },
        {
          type: 'mdxJsxAttribute',
          name: 'images',
          value: 'carousel',
        },
      ]),
    });
  });

  it('supports social publishing and syndication directives', () => {
    const tree: PostkitDirectiveNode = {
      type: 'root',
      children: [
        {
          type: 'leafDirective',
          name: 'postkit-share-actions',
          attributes: {
            url: 'https://example.com/article',
            services: '["native","copy"]',
          },
        },
        {
          type: 'leafDirective',
          name: 'postkit-appears-on',
          attributes: {
            items: '[{"service":"bluesky","url":"https://bsky.app/post/1"}]',
            presentation: 'badges',
          },
        },
        {
          type: 'leafDirective',
          name: 'postkit-social-post',
          attributes: {
            href: 'https://social.example/post/1',
            service: 'linegraph',
            branding: 'full',
          },
        },
      ],
    };

    remarkPostkit()(tree);

    expect(tree.children?.map((child) => child.name)).toEqual([
      'ShareActions',
      'AppearsOn',
      'SocialPost',
    ]);
  });

  it('fails a build for missing, unknown, or invalid props', () => {
    expect(() =>
      remarkPostkit()(
        rootWith({
          type: 'leafDirective',
          name: 'postkit-video',
          attributes: { src: '/video.mp4' },
        }),
      ),
    ).toThrow('requires "title"');

    expect(() =>
      remarkPostkit()(
        rootWith({
          type: 'leafDirective',
          name: 'postkit-audio',
          attributes: {
            src: '/audio.mp3',
            title: 'Episode',
            autoplay: null,
          },
        }),
      ),
    ).toThrow('Unknown Audio prop "autoplay"');

    expect(() =>
      remarkPostkit()(
        rootWith({
          type: 'leafDirective',
          name: 'postkit-video',
          attributes: {
            src: '/video.mp4',
            title: 'Interview',
            preload: 'everything',
          },
        }),
      ),
    ).toThrow('Invalid Video preload value "everything"');
  });

  it('can ignore unknown props for compatibility without emitting them', () => {
    const tree = rootWith({
      type: 'leafDirective',
      name: 'postkit-audio',
      attributes: {
        src: '/audio.mp3',
        title: 'Episode',
        futureProp: 'future',
      },
    });

    remarkPostkit({ output: 'hast', strict: false })(tree);

    expect(tree.children?.[0]?.data?.hProperties).toEqual({
      src: '/audio.mp3',
      title: 'Episode',
    });
  });
});

describe('isPostkitComponentName', () => {
  it('only accepts registered, case-sensitive runtime names', () => {
    expect(isPostkitComponentName('Chart')).toBe(true);
    expect(isPostkitComponentName('Figure')).toBe(true);
    expect(isPostkitComponentName('NewsletterSignup')).toBe(true);
    expect(isPostkitComponentName('chart')).toBe(false);
    expect(isPostkitComponentName('Script')).toBe(false);
  });
});
