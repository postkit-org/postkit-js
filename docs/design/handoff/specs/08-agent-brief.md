# 08 — Agent brief

Use this to start a coding agent (Claude Code or similar) on the build. The handoff lives at `docs/design/handoff/` in `postkit-org/postkit-js`; work on top of branch `v0.3.0`. First copy `templates/CLAUDE.md` into the repo root, merging it with the existing AGENTS.md guidance.

## Kick-off prompt

> You're rebuilding postkit.org, the site for the Postkit component library, in `apps/site` of this repo. The full handoff is in `docs/design/handoff/`. Read `docs/design/handoff/README.md`, then `specs/01-site-spec.md`, `specs/02-design-system.md` and the parts of `specs/03-component-system.md` that the site depends on (§5.5, §6.1, §7.1, §8). Work through `specs/06-work-breakdown.md` in order, starting with PK-001. Each ticket names the boards to match. Rendered boards are in `reference/renders/`, and openable HTML versions are in `reference/previews/`. Use the tokens in `tokens/` as given. After each ticket, run the checks in `specs/07-acceptance-and-test-plan.md` §1. Then stop and summarize: what you built, what you couldn't match, which fallback you used if a package step wasn't ready, and any question from "Questions to bring back".

## Standing rules

1. **Stack is fixed:**
   - Nx, with generators for every new project;
   - Next.js Pages Router;
   - Chakra UI v3 (`createSystem`; no v2 APIs);
   - `@postkit/chakra` for every Postkit component on the site;
   - next-themes for colour mode;
   - next-meta, react-structured, react-fathom and `@sentry/nextjs` (current SDK conventions);
   - Resend for email; Vercel for hosting.
2. **Dogfood, don't fork.** If the site needs a component to do something it can't, open a package ticket against 03 and use the stated fallback. Never copy a component into `apps/site`.
3. **Boards are the source of truth for layout and copy.** The specs are the source of truth for behaviour and rules (02 says the same). If a board and a spec disagree on behaviour, follow the spec and say so.
4. **Never ship placeholders.** `[Bracketed]` text is a stand-in. Wire it to data, or list it in your summary (09 has the list).
5. **Keep the Privacy page true.** No cookies, no tracking pixels, no new third parties, no session replay. Anything that would change a claim in 09 "Facts" is a question, not a change.
6. **Two themes, always.** Check every page in light and dark. Colours come from `libs/site-theme` semantic tokens only.
7. **Generated means generated.** Counts, props, defaults, support tables, search, feeds and OG images all come from the manifest and the content collections, never from hand-copied values.
8. **Don't invent design.** Pages without a board (most docs pages, the already-subscribed email) reuse existing layouts and components.
9. **"Postkit"**, never "PostKit".
10. **Mobile matters:** test at 390 and 320 every time.

## Questions to bring back (don't guess)

- Anything in `09-content-callouts.md` you need in order to ship a ticket.
- A package step (03 §8) that's needed sooner than planned, or a fallback that turns out not to work.
- Any spec rule that seems to contradict a board.
- Any dependency you'd add that isn't in the stack above.
