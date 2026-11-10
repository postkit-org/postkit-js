import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';

export const authorCardDefinition = definePostkitComponent({
  name: 'AuthorCard',
  directive: 'postkit-author-card',
  category: 'discovery',
  description: 'A semantic author biography with portrait and profile links.',
  children: 'mdx',
  runtime: 'static',
  stability: 'initial',
  email: { fallback: 'text' },
  props: {
    ...presentation,
    name: prop.string('The author display name.', { required: true }),
    role: prop.string('The author role, title, or affiliation.'),
    avatarSrc: prop.string('The author portrait URL.'),
    avatarAlt: prop.string('Alternative text for the author portrait.'),
    href: prop.string('The author profile URL.'),
    bio: prop.string('A plain-text author biography.'),
    links: prop.json(
      'A JSON array of author links with label, href, and optional rel fields.',
    ),
    presentation: prop.enum(['card', 'compact', 'inline'], {
      description: 'How much author detail is displayed.',
      default: 'card',
      themeVariant: true,
    }),
  },
  slots: [
    'root',
    'avatar',
    'content',
    'header',
    'name',
    'nameLink',
    'role',
    'bio',
    'links',
    'link',
  ],
  example: {
    props: { name: 'Ada Example' },
    children: 'Example content.',
  },
});
