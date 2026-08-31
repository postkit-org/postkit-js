export class PostkitParseError extends Error {
  readonly code:
    | 'invalid-document'
    | 'invalid-json'
    | 'unsafe-mdx-expression'
    | 'unsupported-format';

  constructor(
    code: PostkitParseError['code'],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'PostkitParseError';
    this.code = code;
  }
}
