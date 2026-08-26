import { describe, expect, it } from 'vitest';

import {
  createPostkitEmailAction,
  createPostkitEmailMediaModel,
  numericEmailDimension,
} from './models.js';

describe('email render models', () => {
  it('creates actions only from complete label and destination pairs', () => {
    expect(createPostkitEmailAction(' Read ', ' https://example.com ')).toEqual(
      { label: 'Read', href: 'https://example.com' },
    );
    expect(createPostkitEmailAction('Read', undefined)).toBeUndefined();
    expect(
      createPostkitEmailAction(' ', 'https://example.com'),
    ).toBeUndefined();
  });

  it('normalizes media copy independently from its renderer', () => {
    expect(
      createPostkitEmailMediaModel({
        src: ' https://media.example/demo.mp4 ',
        title: ' Demo ',
        caption: ' Two minutes ',
        poster: ' https://media.example/demo.jpg ',
        actionLabel: 'Watch video',
      }),
    ).toEqual({
      action: {
        href: 'https://media.example/demo.mp4',
        label: 'Watch video',
      },
      title: 'Demo',
      caption: 'Two minutes',
      poster: 'https://media.example/demo.jpg',
    });
  });

  it('accepts only positive finite legacy image dimensions', () => {
    expect(numericEmailDimension('640px')).toBe(640);
    expect(numericEmailDimension(320.8)).toBe(320);
    expect(numericEmailDimension(0)).toBeUndefined();
    expect(numericEmailDimension('auto')).toBeUndefined();
  });
});
