# PostKit examples

These examples use the same portable article contract at different application
boundaries. They are checked in CI so package and framework changes cannot
silently invalidate the documented integrations.

| Example                              | What it demonstrates                                                            | Validation                                    |
| ------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------- |
| [`astro`](astro)                     | A complete Astro MDX site, custom Chakra system module, and selective hydration | Production build and rendered HTML assertions |
| [`email`](email)                     | Chakra Email rendering with Postkit's email-safe component fallbacks            | TypeScript                                    |
| [`next`](next)                       | Next.js's native `mdx-components.tsx` entry point                               | TypeScript                                    |
| [`react-router`](react-router)       | An MDX component map beneath React Router                                       | TypeScript                                    |
| [`tanstack-router`](tanstack-router) | Portable URLs mapped into a typed route                                         | TypeScript                                    |
| [`unfurl-server`](unfurl-server)     | A server-owned resolver registry and normalized result                          | TypeScript and runtime smoke test             |

The Astro article is the canonical sample content. Other framework examples
focus on the adapter boundary rather than duplicating the authored document.
The PostKit documentation site in `apps/site` is also a complete Next.js
application using local PostKit packages.

Run every example check from the repository root:

```sh
npm run examples:check
```
