# 04 — Release emails

One list: "one email per Postkit release, nothing else". It uses double opt-in, Resend for delivery and audience, and no database.

Boards: SiteNotes (the card in place), SiteSignupStates / PhoneSignupStates, SiteConfirmed, SiteConfirmExpired (+ Phone), EmailConfirm, EmailRelease. SiteUnsubscribed / PhoneUnsubscribed (the site's unsubscribe page, §1a).

---

## 1. Flow

```
Reader submits the form on /notes or /newsletter/subscribe (including its Expired state)
  → POST /api/newsletter/subscribe { email }
      validate address → sign token → Resend: send "Confirm your email"
      ← 202 { state: 'check-inbox' }        (same response for new and existing addresses)
Reader clicks the link (valid 7 days)
  → GET /api/newsletter/confirm?token=…
      open token + check expiry → Resend: upsert contact in the "Postkit releases" audience, unsubscribed=false
      → 303 /newsletter/subscribe?status=confirmed#for=r…@example.com
      (bad or expired token → 303 /newsletter/subscribe?status=expired)
Release day
  → npm run release:email -- 0.3.0 --create   (renders the email; with --create, makes a Resend Broadcast draft)
  → Ryan reviews and sends it from Resend
Reader unsubscribes
  footer link   → GET /newsletter/unsubscribe?token=…   (static page; changes nothing on GET)
                    → the page POSTs the token to /api/newsletter/unsubscribe on load
  mail client   → POST /api/newsletter/unsubscribe?token=…   (List-Unsubscribe-Post: One-Click)
      open token → Resend: update contact, unsubscribed=true → 200
      (bad token → 400; the page shows "That link doesn't work")
```

**Tokens**
- **Sealed, not just signed.** A token is `base64url(nonce ‖ ciphertext ‖ tag)`: AES-256-GCM with a random 96-bit nonce, keyed by `SUBSCRIBE_SECRET`, with the purpose (`confirm` or `unsubscribe`) as associated data. The plaintext is `{ email, expiresAt? }`. The address can't be read from the token, so it never appears in a URL, and so never in Vercel's request logs, Sentry or Fathom. Tampering fails the GCM tag check.
- **Confirm:** expires after 7 days.
- **Unsubscribe:** never expires (US law needs unsubscribe links to keep working for at least 30 days, and there's no reason to stop). `confirm` makes one and stores it on the contact as the `unsubscribe_token` property for Broadcasts (§4). The already-subscribed email gets a fresh one.
- Because the purpose is bound into the tag, a confirm token can't unsubscribe anyone, and an unsubscribe token can't subscribe anyone.
- Confirming twice is harmless (an idempotent upsert), so the links aren't single-use. The expired page's copy reflects that. Unsubscribing twice is harmless too: the second call changes nothing and shows the same result.
- **No address in logs:** the routes never log an address (no `console.log` of the body or the opened token), and Sentry scrubs request bodies (01 §12). The only place an address appears in a URL is the masked `#for=r…@example.com` fragment, which browsers never send to servers.

**Already subscribed**
- The form shows the same "Check your inbox" state, so nobody can test whether an address is on the list.
- The email sent is a short "You're already subscribed" note instead of the confirmation. It has the same layout as EmailConfirm with no button; the copy is in §3.

**Abuse limits**
- Requests are rate-limited per IP and per address, with Vercel's firewall or an in-memory limit per instance. A limit of 3 requests per address per hour is enough.
- A honeypot field, and no CAPTCHA.
- Addresses are normalised (trimmed and lower-cased) but never otherwise altered.

**Queues**
- Sending is one Resend API call while the reader waits, so the form can show the right state.
- It runs inline with an `Idempotency-Key` (a hash of the address and the 10-minute window).
- On failure it returns the designed error state. See 09 Q1 for the queue question.

## 1a. Unsubscribe page (SiteUnsubscribed, PhoneUnsubscribed)

`/newsletter/unsubscribe?token=…` is a static page on the ResultPage layout (02 §5), like Confirmed and Expired.
- A GET never changes anything, so link scanners and prefetchers can't unsubscribe anyone.
- On load, the page POSTs the token to `/api/newsletter/unsubscribe` and shows the result. That keeps the board's "one click, no form, no sign-in".
- Without JavaScript, a `<noscript>` form posts the same request. The API answers a form post with a 303 to `/newsletter/unsubscribe#done`.

Only the Done state is drawn. The others reuse the layouts and copy patterns already on the boards (08 rule 8).

| State | When | UI |
|---|---|---|
| Working | request in flight | The board's layout: mono label "Unsubscribe", title "Taking you off the list." with grey "One moment.", no actions. `role="status"` |
| Done | 200 | Exactly SiteUnsubscribed: "You're off the list." / "No more release emails.", the lede, and "Back to postkit.org". "Sign up again" links to `/newsletter/subscribe` |
| Bad link | missing, malformed or tampered token (400) | The SiteConfirmExpired layout without the form: label "Link not valid", "That link doesn't work." with grey "Nothing was changed.", and the lede "Use the Unsubscribe link in the latest Postkit email, or write to hello@postkit.org." |
| Couldn't unsubscribe | network or 5xx | The Working layout, plus the caution-tinted `role="alert"` box from form state 6: "We couldn't take you off the list just now. Try again in a minute." and a Try again button |

The page has `noindex`, and isn't in the sitemap or search.

## 1b. Subscribe page (`/newsletter/subscribe`)

A static page on the ResultPage layout (02 §5). It's where the confirm link lands, and the URL to share for signing up. There's no board for the form view, so it reuses the subscribe card's copy and the six form states (§2) on the ResultPage layout, the same way SiteConfirmExpired puts a form there.

| `status` | UI |
|---|---|
| none | Mono label "Release emails", title "Follow along." with grey "One email per release, nothing else.", the SubscribeForm, then "Or subscribe with RSS, Atom or JSON Feed." (the copy from the card on SiteNotes) |
| `confirmed` | Exactly SiteConfirmed, with the masked address read from the `#for=` fragment |
| `expired` | Exactly SiteConfirmExpired, with its "Send link" form |
| anything else | Same as none |

- The page is static, so it reads `status` after hydration. Until the router is ready, render the layout without the title block so the form never flashes before Confirmed or Expired.
- Confirmed fires the `subscribe-confirmed` goal once, then removes `status` and the fragment from the address bar (`history.replaceState`), so a reload or a shared link shows the form.
- The paths under `/newsletter/` are only URLs. The copy still says "release emails".

## 2. Form states (SiteSignupStates)

| # | State | Trigger | UI |
|---|---|---|---|
| 1 | Idle | default | Field and Subscribe button. Validation runs only on submit |
| 2 | Invalid address | client check on submit | 2px caution ring, the message "Enter an email address like you@example.com." with an "!" badge, `aria-invalid`, focus back to the field |
| 3 | Sending | request in flight | Field read-only, button disabled with a spinner and "Subscribing…" |
| 4 | Check your inbox | 202 | The form is replaced: tick, "Check your inbox.", the address in medium weight, and "Wrong address? Use a different one" (restores the idle form with the value) |
| 5 | Already subscribed | 202 (same response) | Identical to 4 |
| 6 | Couldn't subscribe | network or 5xx | Form kept with its value, plus a caution-tinted `role="alert"` box: "We couldn't sign you up just now. Nothing was saved. Try again in a minute." |

The status text is announced (`role="status"`). On phones the button wraps under the field.

## 3. Emails

Both are built in `libs/site-emails` with `@postkit/email` and Chakra Email, on `libs/site-theme` tokens.
- **Design:** light theme only, 600px wide, `bg.subtle` page with a white card (20px radius, 40px padding), the logo pill and wordmark above the card.
- **Footer:** "why you got this", then links, then "Postkit, by Commune Software · 1870 The Exchange SE Ste 220, PMB 980007, Atlanta, GA 30339-2171". On narrow clients the address may wrap after the suite number; keep "PMB 980007" in it (USPS needs it on mail to a private mailbox). The confirm email links only to Privacy (the reader isn't subscribed yet). The already-subscribed email links to Unsubscribe (`/newsletter/unsubscribe?token=…`) and Privacy. The release email links to Unsubscribe (§4), Read on the web (`/changelog/{version}`) and Privacy.
- **No tracking:** turn off Resend open and click tracking. The Privacy page promises no tracking pixels.
- **Plain text:** each email ships a plain-text part. The confirm and already-subscribed emails have short hand-written text parts. The release email uses the `text` from `renderEmail` (03 §6.1).
- **Tokens:** `libs/site-theme` exports the raw values from `tokens.json` as well as the Chakra system. `libs/site-emails` maps those values into Chakra Email's theme format; it doesn't import the site's Chakra system.

**Confirm (EmailConfirm)**
- From: `Postkit <releases@postkit.org>`. Subject: "Confirm your Postkit release emails". Preheader: "One click and you'll get an email each time Postkit ships."
- Body: "Confirm your email" / "Click below and you'll get one email each time Postkit ships a release. Nothing else." / [Confirm subscription] / "The link works for 7 days. If you didn't ask for this, ignore this email and nothing happens."

**Already subscribed (not drawn; the confirm layout with no button)**
- Subject: "You're already getting Postkit release emails".
- Body: "You're already on the list. Nothing to do. The next email comes with the next release." Its footer has the Unsubscribe link. It's sent with `List-Unsubscribe: <https://postkit.org/api/newsletter/unsubscribe?token=…>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers, so mail clients show their own unsubscribe button.

**Release (EmailRelease)**
- Built from a changelog entry, so it's never written twice.
- Subject: "Postkit {version}: {subtitle}". Preheader: the entry's `summary`. (The summary on the board is illustrative; the real one comes from the entry.)
- Body:
  - mono label "Release · {date}", then "Postkit {version}." with the grey `subtitle`;
  - the summary;
  - the first warning callout, if any (as an email-safe callout);
  - "Added" (the first 4 items);
  - "Upgrading" with the first code block;
  - [Read the full release notes] → `/changelog/{version}`;
  - the package list.
- The board shows 0.2.0 with real content.

## 4. Sending a release

`npm run release:email -- <version> [--create]`: a root `package.json` script that runs the `release-email` Nx target on `apps/site` (both added in PK-053).
1. Loads the changelog entry. It refuses `status: upcoming`.
2. Renders the release email with `renderEmail` and writes `dist/emails/<version>.html` and `.txt` for review.
3. With `--create`, makes a Resend Broadcast **draft** for the audience. It never sends.

Ryan reviews the draft and sends it from Resend.

**Unsubscribe in the release email**
- The footer link is `https://postkit.org/newsletter/unsubscribe?token={{{contact.unsubscribe_token}}}`, so release emails use the site's page too.
- PK-050 confirms that Resend renders custom contact properties in Broadcasts. Its docs show `{{{contact.email}}}` and say properties can be used, but don't show a custom one.
- If they don't render, the link falls back to `{{{RESEND_UNSUBSCRIBE_URL}}}`, with Resend's hosted page branded to match SiteUnsubscribed. Either way the same contact ends up `unsubscribed: true`.
- Check on a test send that the Broadcast carries `List-Unsubscribe` headers (Gmail shows its unsubscribe button).

## 5. Environment

| Variable | Use |
|---|---|
| `RESEND_API_KEY` | Sending, audience, broadcasts |
| `RESEND_AUDIENCE_ID` | "Postkit releases" |
| `SUBSCRIBE_SECRET` | AES-256-GCM key for the tokens: exactly 32 random bytes, base64-encoded |
| `NEXT_PUBLIC_SITE_URL` | `https://postkit.org` (preview deploys use their own URL in links) |

The sending domain `postkit.org` needs SPF, DKIM and DMARC set up in Resend before launch.
