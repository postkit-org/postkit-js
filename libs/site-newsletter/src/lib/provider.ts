/**
 * What the newsletter routes need from Resend, behind a small interface so tests use a fake
 * (`src/testing/fake-provider.ts`) and production uses `createResendProvider`. Every method
 * works on the one audience the provider was created for.
 */
export interface NewsletterProvider {
  /** The contact in the audience, or `null` if there isn't one. */
  getContact(email: string): Promise<ContactRecord | null>;
  /** Adds a contact. `'exists'` if one was there already (a race with another request). */
  createContact(contact: ContactInput): Promise<'created' | 'exists'>;
  /** Updates a contact. `'not-found'` if there's no such contact. */
  updateContact(
    email: string,
    patch: ContactPatch,
  ): Promise<'updated' | 'not-found'>;
  /**
   * Sends one email. `'duplicate'` when the provider has already accepted a send with the
   * same idempotency key (the reader asked twice inside the window and already has an email).
   */
  sendEmail(
    message: OutgoingEmail,
    options: { readonly idempotencyKey: string },
  ): Promise<'sent' | 'duplicate'>;
}

export interface ContactRecord {
  readonly unsubscribed: boolean;
}

/** The contact property that holds the contact's unsubscribe token (04 §4). */
export const UNSUBSCRIBE_TOKEN_PROPERTY = 'unsubscribe_token';

export interface ContactProperties {
  readonly [UNSUBSCRIBE_TOKEN_PROPERTY]?: string;
}

export interface ContactInput {
  readonly email: string;
  readonly unsubscribed: boolean;
  readonly properties?: ContactProperties;
}

export interface ContactPatch {
  readonly unsubscribed?: boolean;
  readonly properties?: ContactProperties;
}

export interface OutgoingEmail {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly headers?: Readonly<Record<string, string>>;
}

/** Which provider call failed. */
export type ProviderOperation =
  'get-contact' | 'create-contact' | 'update-contact' | 'send-email';

/**
 * A provider call failed. It carries only the operation, the provider's error name and the
 * HTTP status, never the provider's message, which can quote the address. Safe to report.
 */
export class NewsletterProviderError extends Error {
  readonly operation: ProviderOperation;
  readonly code: string;
  readonly status: number | null;

  constructor(
    operation: ProviderOperation,
    code: string,
    status: number | null,
  ) {
    super(
      `Newsletter provider ${operation} failed: ${code} (${status ?? 'no status'})`,
    );
    this.name = 'NewsletterProviderError';
    this.operation = operation;
    this.code = code;
    this.status = status;
  }
}
