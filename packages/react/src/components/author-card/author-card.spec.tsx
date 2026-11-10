// @vitest-environment node

import { authorCardDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { AuthorCard } from './author-card.js';

describe('headless AuthorCard', () => {
  it('renders an initial, a linked name, a role, a bio and links', () => {
    expect(AuthorCard.definition).toBe(authorCardDefinition);
    const markup = renderToStaticMarkup(
      <AuthorCard
        name="Ada Example"
        role="Editor"
        href="/ada"
        bio="Writes things."
        links='[{"label":"Site","href":"https://ada.example","rel":"me"}]'
      />,
    );

    expect(markup).toContain(
      '<aside aria-label="About Ada Example" data-postkit-component="AuthorCard" data-postkit-part="root" data-size="md" data-variant="subtle" data-presentation="card">',
    );
    expect(markup).toContain(
      '<span data-postkit-part="avatar"><span aria-hidden="true">A</span></span>',
    );
    expect(markup).toContain(
      '<p data-postkit-part="name"><a data-postkit-part="nameLink" href="/ada" rel="author">Ada Example</a></p>',
    );
    expect(markup).toContain('<span data-postkit-part="role">Editor</span>');
    expect(markup).toContain(
      '<div data-postkit-part="bio">Writes things.</div>',
    );
    expect(markup).toContain(
      '<ul data-postkit-part="links" aria-label="Ada Example links"><li>' +
        '<a data-postkit-part="link" href="https://ada.example" rel="me">Site</a></li></ul>',
    );
  });

  it('shows a portrait, prefers children to the bio and omits empty parts', () => {
    const markup = renderToStaticMarkup(
      <AuthorCard
        name="Ada"
        avatarSrc="/ada.jpg"
        bio="Plain"
        presentation="compact"
      >
        <em>Rich</em>
      </AuthorCard>,
    );

    expect(markup).toContain('<img src="/ada.jpg" alt="" loading="lazy"/>');
    expect(markup).toContain(
      '<div data-postkit-part="bio"><em>Rich</em></div>',
    );
    expect(markup).toContain('data-presentation="compact"');
    expect(markup).not.toContain('data-postkit-part="links"');
    expect(markup).not.toContain('data-postkit-part="nameLink"');
    expect(markup).not.toContain('data-postkit-part="role"');
  });
});
