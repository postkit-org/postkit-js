import { Resend } from 'resend';

import {
  NewsletterProviderError,
  type NewsletterProvider,
  type ProviderOperation,
} from './provider';

interface ResendError {
  readonly name: string;
  readonly statusCode: number | null;
}

/** Resend's error names for a reused or in-flight idempotency key. */
const DUPLICATE_SEND = new Set([
  'invalid_idempotent_request',
  'concurrent_idempotent_requests',
]);

function isNotFound(error: ResendError): boolean {
  return error.name === 'not_found' || error.statusCode === 404;
}

function fail(operation: ProviderOperation, error: ResendError): never {
  // Only the name and status: Resend's message can quote the address.
  throw new NewsletterProviderError(
    operation,
    error.name || 'unknown',
    error.statusCode ?? null,
  );
}

export interface ResendProviderOptions {
  readonly apiKey: string;
  /** `RESEND_AUDIENCE_ID`: the "Postkit releases" audience. */
  readonly audienceId: string;
}

/**
 * The production {@link NewsletterProvider}, on the `resend` SDK. Contacts live in the one
 * audience (Resend's legacy audience endpoints, which it now calls segments).
 *
 * Open and click tracking can't be turned off per email in Resend: they're settings on the
 * sending domain. Keep both off for `postkit.org` (the Privacy page promises no pixels).
 */
export function createResendProvider({
  apiKey,
  audienceId,
}: ResendProviderOptions): NewsletterProvider {
  const resend = new Resend(apiKey);
  // `RESEND_DEBUG=true` makes the SDK log failed requests with their path, and contact paths
  // contain the address. Addresses never reach the logs (04 §1), so debug stays off here.
  (resend as unknown as { debug: boolean }).debug = false;

  return {
    async getContact(email) {
      const { data, error } = await resend.contacts.get({ email, audienceId });
      if (error) {
        if (isNotFound(error)) return null;
        fail('get-contact', error);
      }
      return { unsubscribed: Boolean(data?.unsubscribed) };
    },

    async createContact({ email, unsubscribed, properties }) {
      const { error } = await resend.contacts.create({
        audienceId,
        email,
        unsubscribed,
        properties: properties ? { ...properties } : undefined,
      });
      if (error) {
        if (error.statusCode === 409) return 'exists';
        fail('create-contact', error);
      }
      return 'created';
    },

    async updateContact(email, { unsubscribed, properties }) {
      const { error } = await resend.contacts.update({
        email,
        audienceId,
        unsubscribed,
        properties: properties ? { ...properties } : undefined,
      });
      if (error) {
        if (isNotFound(error)) return 'not-found';
        fail('update-contact', error);
      }
      return 'updated';
    },

    async sendEmail(message, { idempotencyKey }) {
      const { error } = await resend.emails.send(
        {
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.headers ? { ...message.headers } : undefined,
        },
        { idempotencyKey },
      );
      if (error) {
        if (DUPLICATE_SEND.has(error.name)) return 'duplicate';
        fail('send-email', error);
      }
      return 'sent';
    },
  };
}
