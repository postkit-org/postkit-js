import { chakra, useSlotRecipe, type HTMLChakraProps } from '@chakra-ui/react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { trackGoal } from '../../lib/analytics';
import { Button, TextField } from '../primitives';
import { CautionAlert } from './caution-alert';
import { looksLikeEmail, requestSubscribe } from './newsletter-api';

/** The five drawn states of 04 §2 (4 and 5, "Already subscribed", look the same: `sent`). */
export type SubscribeFormState =
  'idle' | 'invalid' | 'sending' | 'sent' | 'failed';

export interface SubscribeFormProps extends Omit<
  HTMLChakraProps<'div'>,
  'children' | 'onSubmit'
> {
  /** The button: "Subscribe" (the card, the subscribe page) or "Send link" (Expired). */
  readonly submitLabel?: string;
  /**
   * - `card`: the subscribe card and the subscribe page; on phones the button wraps under
   *   the field, full width (SiteSignupStates, PhoneSignupStates).
   * - `inline`: SiteConfirmExpired's centred row, at most 460px; it only wraps when the
   *   button no longer fits (PhoneConfirmExpired keeps it on one line at 390).
   */
  readonly layout?: 'card' | 'inline';
  /** `subtle` when the form sits on a `bg.subtle` card: the field turns `bg.raised`. */
  readonly surface?: 'page' | 'subtle';
}

export const INVALID_EMAIL_MESSAGE =
  'Enter an email address like you@example.com.';

/** The spinner from the Sending board state: a faint ring and a turning quarter arc. */
function Spinner() {
  return (
    <chakra.svg
      width="16px"
      height="16px"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      flex="none"
      css={{
        '@media (prefers-reduced-motion: no-preference)': {
          animation: 'spin 0.8s linear infinite',
        },
      }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </chakra.svg>
  );
}

/** The link-styled button that brings the form back ("Use a different one"). */
function InlineAction({
  onClick,
  children,
}: {
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      padding="0"
      border="0"
      bg="transparent"
      font="inherit"
      color="accent"
      cursor="pointer"
      textDecorationLine="underline"
      textDecorationThickness="1px"
      textUnderlineOffset="3px"
      borderRadius="xs"
      transitionProperty="text-decoration-thickness"
      transitionDuration="hover"
      transitionTimingFunction="ease-out"
      css={{
        '@media (hover: hover)': {
          _hover: { textDecorationThickness: '2px' },
        },
      }}
    >
      {children}
    </chakra.button>
  );
}

/**
 * The release-email sign-up form with all six states of 04 §2: idle, invalid address, sending,
 * check your inbox, already subscribed (the same screen, so nobody can test who's on the list)
 * and couldn't subscribe. Shared by the card on `/notes` and `/newsletter/subscribe`
 * (including its Expired view). Posts to `/api/newsletter/subscribe`.
 */
export function SubscribeForm({
  submitLabel = 'Subscribe',
  layout = 'card',
  surface = 'page',
  ...rootProps
}: SubscribeFormProps) {
  const [state, setState] = useState<SubscribeFormState>('idle');
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [website, setWebsite] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next render: the field (invalid, form restored) or the status.
  const focusNext = useRef<'field' | 'status' | null>(null);
  const id = useId();
  const inputId = `subscribe-email-${id}`;
  const errorId = `${inputId}-error`;
  const honeypotId = `subscribe-website-${id}`;

  const textField = useSlotRecipe({ key: 'siteTextField' });
  const fieldStyles = textField({ size: 'lg', shape: 'pill', surface });

  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    if (target === 'field') inputRef.current?.focus();
    else statusRef.current?.focus();
  }, [state]);

  const sending = state === 'sending';
  const sent = state === 'sent';
  const invalid = state === 'invalid';
  const card = layout === 'card';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    const address = email.trim();
    if (!looksLikeEmail(address)) {
      if (invalid) {
        // Already invalid: the state doesn't change, so focus here.
        inputRef.current?.focus();
      } else {
        focusNext.current = 'field';
        setState('invalid');
      }
      return;
    }

    setState('sending');
    const result = await requestSubscribe(address, website);

    if (result === 'check-inbox') {
      trackGoal('subscribe-request');
      setSentTo(address);
      focusNext.current = 'status';
      setState('sent');
    } else if (result === 'invalid') {
      focusNext.current = 'field';
      setState('invalid');
    } else {
      setState('failed');
    }
  };

  const useDifferentAddress = () => {
    focusNext.current = 'field';
    setState('idle');
  };

  return (
    <chakra.div position="relative" {...rootProps}>
      {/* 04 §2: the status text is announced. The region is always there so the change is. */}
      <chakra.div
        ref={statusRef}
        role="status"
        tabIndex={sent ? -1 : undefined}
        display={sent ? 'flex' : 'block'}
        gap="14px"
        textAlign="left"
        {...(card ? {} : { maxW: '460px', marginInline: 'auto' })}
        borderRadius="md"
      >
        {sent ? (
          <>
            <chakra.span
              aria-hidden="true"
              flex="0 0 28px"
              height="28px"
              borderRadius="full"
              bg="tone.tip"
              color="fg.inverted"
              fontSize="15px"
              fontWeight="semibold"
              lineHeight="1"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              ✓
            </chakra.span>
            <chakra.div minW="0">
              <chakra.p margin="2px 0 0" fontSize="lg" fontWeight="medium">
                Check your inbox.
              </chakra.p>
              <chakra.p
                margin="6px 0 0"
                fontSize="md"
                lineHeight="1.5"
                color="fg.secondary"
                overflowWrap="anywhere"
              >
                We sent a confirmation link to{' '}
                <chakra.span fontWeight="medium">{sentTo}</chakra.span>. Nothing
                else arrives until you click it.
              </chakra.p>
              <chakra.p margin="10px 0 0" fontSize="14px" color="fg.muted">
                Wrong address?{' '}
                <InlineAction onClick={useDifferentAddress}>
                  Use a different one
                </InlineAction>
              </chakra.p>
            </chakra.div>
          </>
        ) : null}
      </chakra.div>

      {sent ? null : (
        <chakra.form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={sending || undefined}
          display="flex"
          flexDirection="column"
          gap="10px"
          textAlign="left"
          {...(card ? {} : { maxW: '460px', marginInline: 'auto' })}
        >
          <chakra.div
            display="flex"
            gap="8px"
            {...(card
              ? { flexDirection: { base: 'column', md: 'row' } }
              : { flexWrap: 'wrap', justifyContent: 'center' })}
          >
            <chakra.div flex={card ? '1' : '1 1 180px'} minW="0">
              <TextField
                ref={inputRef}
                id={inputId}
                label="Email address"
                hideLabel
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="you@example.com"
                size="lg"
                shape="pill"
                surface={surface}
                value={email}
                readOnly={sending}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  // Validation runs on submit only; editing just clears the old message.
                  if (invalid) setState('idle');
                }}
              />
            </chakra.div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              flex="none"
              disabled={sending}
              _disabled={{ opacity: 0.72, cursor: 'default' }}
            >
              {sending ? (
                <>
                  <Spinner />
                  Subscribing…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </chakra.div>

          {invalid ? (
            <chakra.p
              id={errorId}
              className={textField.classNameMap?.error}
              css={fieldStyles.error}
              marginTop="0"
            >
              <chakra.span
                aria-hidden="true"
                className={textField.classNameMap?.errorBadge}
                css={fieldStyles.errorBadge}
              >
                !
              </chakra.span>
              {INVALID_EMAIL_MESSAGE}
            </chakra.p>
          ) : null}

          {state === 'failed' ? (
            <CautionAlert title="We couldn’t sign you up just now.">
              Nothing was saved. Try again in a minute.
            </CautionAlert>
          ) : null}

          {/* The honeypot (04 §1): hidden from people and assistive tech; bots fill it in. */}
          <chakra.div
            aria-hidden="true"
            position="absolute"
            left="-10000px"
            top="0"
            width="1px"
            height="1px"
            overflow="hidden"
          >
            <label htmlFor={honeypotId}>Website</label>
            <input
              id={honeypotId}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </chakra.div>
        </chakra.form>
      )}
    </chakra.div>
  );
}
