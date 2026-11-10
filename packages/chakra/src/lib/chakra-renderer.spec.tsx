/**
 * @jest-environment jsdom
 */

import { defaultSystem } from '@chakra-ui/react';
import { createPostkit, type PostkitRendererConfig } from '@postkit/react';
import { article, engagement, technical } from '@postkit/react/kits';
import {
  calloutDefinition,
  postkitBuiltInDefinitions,
} from '@postkit/core/components';
import { render } from '@testing-library/react';
import type { ComponentProps, ComponentType } from 'react';

import {
  chakra,
  createPostkitDefaultVariantsConfig,
  postkitChakraViews,
} from './chakra-renderer.js';
import { createPostkitSystem, postkitDefaultTheme } from './theme.js';

globalThis.ResizeObserver ??= class ResizeObserver {
  disconnect() {
    return undefined;
  }
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
};

function renderView(
  postkit: ReturnType<typeof createPostkit<object>>,
  name: string,
  props: Record<string, unknown> = {},
  providerProps: Record<string, unknown> = {},
) {
  const View = postkit.mdxComponents[name] as ComponentType<
    Record<string, unknown>
  >;
  const Provider = postkit.Provider as ComponentType<Record<string, unknown>>;
  return render(
    <Provider {...providerProps}>
      <View {...props} />
    </Provider>,
  ).container;
}

describe('the chakra renderer', () => {
  it('exports a view for every built-in definition', () => {
    expect(Object.keys(postkitChakraViews)).toEqual(
      Object.keys(postkitBuiltInDefinitions),
    );
    expect(chakra.id).toBe('chakra');
  });

  it('renders the interactive components and records support in the manifest', () => {
    const postkit = createPostkit({
      renderer: chakra,
      kits: [article, engagement],
    });
    const names = postkit.definitions.map(({ name }) => name);
    expect(names).toContain('Tabs');
    expect(names).toContain('Poll');

    const manifest = postkit.manifest();
    expect(manifest.components['Tabs'].support).toMatchObject({
      react: 'supported',
      // 03 step 6: Tabs has a headless view too, so nothing is chakra-only.
      headless: 'supported',
      chakra: 'supported',
    });
    expect(manifest.components['Callout'].support).toMatchObject({
      headless: 'supported',
      chakra: 'supported',
    });
  });

  it('writes theme-variant defaults into registered recipes', () => {
    const postkit: PostkitRendererConfig = {
      definitions: [calloutDefinition],
      defaults: { Callout: { variant: 'plain', title: 'Note' } },
    };
    const config = createPostkitDefaultVariantsConfig(postkit, {
      preset: postkitDefaultTheme,
    });
    expect(config?.theme?.slotRecipes?.['postkitCallout']).toMatchObject({
      defaultVariants: { variant: 'plain' },
    });
    const system = createPostkitSystem({
      system: defaultSystem,
      preset: postkitDefaultTheme,
      theme: config,
    });
    expect(
      system.getSlotRecipe('postkitCallout').defaultVariants,
    ).toMatchObject({ variant: 'plain', size: 'md' });

    // A host-native system without Postkit recipes keeps them out.
    expect(createPostkitDefaultVariantsConfig(postkit)).toBeUndefined();
  });

  it('applies defaults through the provider, and an author prop wins', () => {
    const postkit = createPostkit({
      renderer: chakra,
      kits: [article],
      defaults: { Callout: { variant: 'plain', title: 'Note' } },
    });

    for (const preset of [postkitDefaultTheme, undefined]) {
      const defaulted = renderView(
        postkit,
        'Callout',
        { children: 'Body' },
        { preset },
      );
      const root = defaulted.querySelector('[data-postkit-part="root"]');
      expect(root?.getAttribute('data-variant')).toBe('plain');
      expect(defaulted.textContent).toContain('Note');

      const authored = renderView(
        postkit,
        'Callout',
        { variant: 'outline', title: 'Mine' },
        { preset },
      );
      expect(
        authored
          .querySelector('[data-postkit-part="root"]')
          ?.getAttribute('data-variant'),
      ).toBe('outline');
      expect(authored.textContent).toContain('Mine');
    }
  });

  it('gives slot overrides the part props and recipe styles', () => {
    function InkMark(props: ComponentProps<'span'>) {
      return <b data-ink {...props} />;
    }
    const postkit = createPostkit({
      renderer: chakra,
      kits: [article],
      overrides: { Callout: { slots: { icon: InkMark } } },
    });
    const container = renderView(
      postkit,
      'Callout',
      { tone: 'tip', classNames: { icon: 'mark' } },
      { preset: postkitDefaultTheme },
    );
    const icon = container.querySelector('[data-postkit-part="icon"]');
    expect(icon?.tagName).toBe('B');
    expect(icon?.getAttribute('data-ink')).toBe('true');
    expect(icon?.className).toContain('mark');
    expect(icon?.className).toContain('postkit-callout__icon');
  });

  it('passes defaults as props to views that read no provider config', () => {
    const postkit = createPostkit({
      renderer: chakra,
      kits: [technical],
      defaults: { CodeBlock: { lineNumbers: true } },
    });
    expect(
      (postkit.mdxComponents['CodeBlock'] as { displayName?: string })
        .displayName,
    ).toBe('PostkitDefaults(CodeBlock)');
    expect(() =>
      createPostkit({
        renderer: chakra,
        kits: [technical],
        overrides: { CodeBlock: { slots: { root: () => null } } },
      }),
    ).toThrow("CodeBlock's view isn't built with postkitView");
  });
});
