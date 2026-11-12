import { isValidEmail, maskEmail, normalizeEmail } from './email-address';

describe('normalizeEmail', () => {
  it('trims and lower-cases, and changes nothing else', () => {
    expect(normalizeEmail('  Reader.Name+Tag@Example.COM \n')).toBe(
      'reader.name+tag@example.com',
    );
  });
});

describe('isValidEmail', () => {
  it.each([
    'you@example.com',
    'reader.name+tag@example.co.uk',
    "o'brien@example.ie",
    'a@b.io',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'you',
    'you@',
    '@example.com',
    'you@example',
    'you@@example.com',
    'you@exa mple.com',
    'you@.example.com',
    '.you@example.com',
    'you..me@example.com',
    'you/me@example.com',
    'you?@example.com',
    'you#@example.com',
    'you%40@example.com',
    'you@example.c0m',
    `${'a'.repeat(65)}@example.com`,
    `you@${'a'.repeat(250)}.com`,
  ])('rejects %j', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('reader@example.com')).toBe('r…@example.com');
    expect(maskEmail('r@example.com')).toBe('r…@example.com');
  });
});
