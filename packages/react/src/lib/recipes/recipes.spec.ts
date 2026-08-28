import { postkitAudioRecipe, postkitAudioSlots } from './audio.recipe.js';
import {
  postkitAuthorCardRecipe,
  postkitAuthorCardSlots,
} from './author-card.recipe.js';
import {
  postkitCallToActionRecipe,
  postkitCallToActionSlots,
} from './call-to-action.recipe.js';
import {
  postkitCarouselRecipe,
  postkitCarouselSlots,
} from './carousel.recipe.js';
import { postkitChartRecipe, postkitChartSlots } from './chart.recipe.js';
import { postkitFigureRecipe, postkitFigureSlots } from './figure.recipe.js';
import {
  postkitLinkPreviewRecipe,
  postkitLinkPreviewSlots,
} from './link-preview.recipe.js';
import {
  postkitNewsletterSignupRecipe,
  postkitNewsletterSignupSlots,
} from './newsletter-signup.recipe.js';
import {
  postkitProseRecipe,
  postkitProseRhythm,
  postkitProseSlots,
} from './prose.recipe.js';
import {
  postkitShareActionsRecipe,
  postkitShareActionsSlots,
} from './share-actions.recipe.js';
import {
  postkitSocialPostRecipe,
  postkitSocialPostSlots,
} from './social-post.recipe.js';
import {
  postkitCodeBlockRecipe,
  postkitCodeBlockSlots,
  postkitCodeGroupRecipe,
  postkitCodeGroupSlots,
  postkitStandaloneCodeBlockRecipe,
  postkitStandaloneCodeGroupRecipe,
  postkitStandaloneTerminalRecipe,
  postkitTerminalRecipe,
  postkitTerminalSlots,
} from './technical-content.recipe.js';
import { postkitVideoRecipe, postkitVideoSlots } from './video.recipe.js';

describe('Postkit slot recipes', () => {
  it.each([
    ['AppearsOn', postkitAppearsOnRecipe, postkitAppearsOnSlots],
    ['Audio', postkitAudioRecipe, postkitAudioSlots],
    ['AuthorCard', postkitAuthorCardRecipe, postkitAuthorCardSlots],
    ['CallToAction', postkitCallToActionRecipe, postkitCallToActionSlots],
    ['Carousel', postkitCarouselRecipe, postkitCarouselSlots],
    ['Chart', postkitChartRecipe, postkitChartSlots],
    ['CodeBlock', postkitCodeBlockRecipe, postkitCodeBlockSlots],
    ['CodeGroup', postkitCodeGroupRecipe, postkitCodeGroupSlots],
    ['Figure', postkitFigureRecipe, postkitFigureSlots],
    ['LinkPreview', postkitLinkPreviewRecipe, postkitLinkPreviewSlots],
    [
      'NewsletterSignup',
      postkitNewsletterSignupRecipe,
      postkitNewsletterSignupSlots,
    ],
    ['ShareActions', postkitShareActionsRecipe, postkitShareActionsSlots],
    ['SocialPost', postkitSocialPostRecipe, postkitSocialPostSlots],
    ['Terminal', postkitTerminalRecipe, postkitTerminalSlots],
    ['Video', postkitVideoRecipe, postkitVideoSlots],
  ])(
    '%s exposes stable multi-part styling slots and variants',
    (_, recipe, slots) => {
      expect(recipe.slots).toEqual(slots);
      expect(recipe.slots).toContain('root');
      expect(new Set(recipe.slots).size).toBe(recipe.slots.length);
      expect(recipe.className).toMatch(/^postkit-/);
      expect(Object.keys(recipe.variants?.size ?? {})).toEqual([
        'sm',
        'md',
        'lg',
      ]);
      expect(Object.keys(recipe.variants?.variant ?? {})).toEqual([
        'outline',
        'subtle',
        'plain',
      ]);
    },
  );

  it('keeps technical-content structure semantic and standalone visuals opt-in', () => {
    expect(postkitCodeBlockSlots).toEqual(
      expect.arrayContaining([
        'title',
        'filename',
        'control',
        'actions',
        'copyTrigger',
        'button',
        'copyIndicator',
        'content',
        'scroller',
        'codeText',
        'lineContent',
      ]),
    );
    expect(postkitCodeBlockRecipe.base?.root).toMatchObject({
      background: 'bg',
      color: 'fg',
    });
    expect(postkitCodeBlockRecipe.base?.language?.color).toBe('fg.muted');
    expect(postkitCodeBlockRecipe.base?.lineNumber?.color).toBe('fg.muted');
    expect(postkitCodeBlockRecipe.base?.code?.minWidth).toBeUndefined();
    expect(postkitCodeGroupRecipe.base?.tabs?.background).toBe('bg.muted');
    expect(postkitTerminalRecipe.base?.root?.background).toBe('bg');
    expect(postkitTerminalRecipe.base?.output?.color).toBe('fg.muted');

    expect(postkitStandaloneCodeBlockRecipe.base?.root).toMatchObject({
      background: 'gray.950',
      color: 'gray.100',
    });
    expect(postkitStandaloneCodeGroupRecipe.base?.tabs?.background).toBe(
      'gray.900',
    );
    expect(postkitStandaloneTerminalRecipe.base?.root?.background).toBe(
      'gray.950',
    );
  });

  it('exposes prose as a stable multi-part Markdown recipe', () => {
    expect(postkitProseRecipe.slots).toEqual(postkitProseSlots);
    expect(postkitProseRecipe.slots).toContain('root');
    expect(postkitProseRecipe.slots).toEqual(
      expect.arrayContaining([
        'h1',
        'h2',
        'h3',
        'p',
        'a',
        'blockquote',
        'pre',
        'code',
        'table',
        'input',
      ]),
    );
    expect(new Set(postkitProseRecipe.slots).size).toBe(
      postkitProseRecipe.slots.length,
    );
    expect(postkitProseRecipe.className).toBe('postkit-prose');
    expect(postkitProseRecipe.base?.h2?.marginBlockStart).toBeUndefined();
    expect(postkitProseRhythm['--postkit-prose-flow-space']).toBe(
      'var(--chakra-spacing-4)',
    );
    expect(
      postkitProseRhythm['& > :where(* + [data-postkit-prose-element="h2"])'],
    ).toEqual({
      marginBlockStart: 'var(--postkit-prose-heading-space)',
    });
  });
});
import {
  postkitAppearsOnRecipe,
  postkitAppearsOnSlots,
} from './appears-on.recipe.js';
