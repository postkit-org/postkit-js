import { createPostkit, type PostkitSlotProps } from '@postkit/react';
import { article, media, technical } from '@postkit/react/kits';
import { postkitRemarkPlugins } from '@postkit/react/remark';

import { showcaseDefinition } from '../component-definition/showcase.definition';
import { HeadlessShowcase } from './showcase';

/** A slot override (rung 5): it receives the icon part's props. */
function InkMark(props: PostkitSlotProps) {
  return <span {...props} className={`ink-mark ${props.className ?? ''}`} />;
}

/**
 * The headless set: three kits plus the site's own Showcase. Omitting
 * `renderer` uses `@postkit/react`'s views, each loaded the first time a page
 * renders it; style them with `styles.css` or the site's CSS on the anatomy.
 */
export const postkit = createPostkit({
  kits: [article, technical, media],
  components: [{ definition: showcaseDefinition, view: HeadlessShowcase }],
  defaults: {
    Callout: { variant: 'plain' },
    Showcase: { frame: 'laptop' },
  },
  overrides: { Callout: { slots: { icon: InkMark } } },
  link: { openExternalInNewTab: true },
});

/**
 * For an MDX compiler (build-time code): the Remark plugins for this set, so
 * directives validate against exactly the enabled components.
 */
export const mdxOptions = { remarkPlugins: postkitRemarkPlugins(postkit) };
export const mdxComponents = postkit.mdxComponents;

export function HeadlessArticle({ children }: { readonly children: string }) {
  const { Callout, Showcase } = postkit.mdxComponents;
  return (
    <postkit.Provider>
      <article>
        <Callout tone="tip">{children}</Callout>
        <Showcase screens={[{ src: '/media/editor.png', alt: 'The editor' }]} />
      </article>
    </postkit.Provider>
  );
}

/** The manifest of exactly this set, for editors such as Prismark. */
export const manifest = postkit.manifest();
