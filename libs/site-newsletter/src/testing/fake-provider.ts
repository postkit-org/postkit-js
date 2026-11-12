import type {
  ContactInput,
  ContactPatch,
  NewsletterProvider,
  OutgoingEmail,
} from '../lib/provider';
import { NewsletterProviderError } from '../lib/provider';

export interface FakeContact {
  email: string;
  unsubscribed: boolean;
  properties: Record<string, string>;
}

export interface SentEmail {
  readonly message: OutgoingEmail;
  readonly idempotencyKey: string;
}

/**
 * An in-memory Resend for tests only (it lives outside `src/lib` and isn't exported). It
 * models what the routes rely on: one audience keyed by address, `create` refusing an
 * existing contact, `update` reporting a missing one, and idempotency keys that turn a repeat
 * send into a duplicate.
 */
export class FakeProvider implements NewsletterProvider {
  readonly contacts = new Map<string, FakeContact>();
  readonly sent: SentEmail[] = [];
  /** Every call, in order, by operation name. */
  readonly calls: string[] = [];
  /** Set to make every call fail, as Resend would when it's down. */
  failWith: NewsletterProviderError | null = null;

  private readonly idempotencyKeys = new Set<string>();

  private check(operation: string): void {
    this.calls.push(operation);
    if (this.failWith) throw this.failWith;
  }

  async getContact(email: string) {
    this.check('get-contact');
    const contact = this.contacts.get(email);
    return contact ? { unsubscribed: contact.unsubscribed } : null;
  }

  async createContact({ email, unsubscribed, properties }: ContactInput) {
    this.check('create-contact');
    if (this.contacts.has(email)) return 'exists' as const;
    this.contacts.set(email, {
      email,
      unsubscribed,
      properties: { ...(properties ?? {}) } as Record<string, string>,
    });
    return 'created' as const;
  }

  async updateContact(
    email: string,
    { unsubscribed, properties }: ContactPatch,
  ) {
    this.check('update-contact');
    const contact = this.contacts.get(email);
    if (!contact) return 'not-found' as const;
    if (unsubscribed !== undefined) contact.unsubscribed = unsubscribed;
    if (properties) Object.assign(contact.properties, properties);
    return 'updated' as const;
  }

  async sendEmail(
    message: OutgoingEmail,
    { idempotencyKey }: { readonly idempotencyKey: string },
  ) {
    this.check('send-email');
    if (this.idempotencyKeys.has(idempotencyKey)) return 'duplicate' as const;
    this.idempotencyKeys.add(idempotencyKey);
    this.sent.push({ message, idempotencyKey });
    return 'sent' as const;
  }

  /** Adds a contact directly, as if confirmed earlier. */
  seed(email: string, unsubscribed = false): void {
    this.contacts.set(email, { email, unsubscribed, properties: {} });
  }
}

/** A Resend outage, as the real provider reports it. */
export function providerOutage(): NewsletterProviderError {
  return new NewsletterProviderError('send-email', 'application_error', 500);
}
