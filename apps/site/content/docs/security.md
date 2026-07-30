---
title: Security and trust boundaries
summary: Keep credentials, remote fetching, embed markup, authored URLs, and host callbacks inside explicit trust boundaries.
category: Reference
order: 87
---

# Security and trust boundaries

PostKit separates portable authored content from trusted application
infrastructure. Treat every URL, metadata response, saved snapshot, and
Markdown document as untrusted input.

## Remote resolution

Run `@postkit/unfurl` in a server, build process, or trusted editor. Provider
credentials must never enter the rendered document or browser bundle.

Provider adapters send the authored URL to a configured metadata service.
Custom resolvers that fetch origins directly must protect against server-side
request forgery:

- Accept only intended protocols
- Block private, loopback, link-local, and cloud metadata destinations
- Revalidate every redirect
- Enforce timeouts and response-size limits
- Restrict content types and parse depth
- Cache normalized results under an application-owned policy

## Embeds

Resolvers may retain provider markup as `embed.rawHtml`. PostKit's React
renderer never injects that field. A host that chooses to render it owns HTML
sanitization, iframe isolation, content security policy, consent, and provider
allowlisting.

Validated iframe and media URLs are still third-party resources. Apply the
host's `sandbox`, `allow`, referrer, privacy, and consent policies.

## Authored content

Plain Markdown directives accept allowlisted literal values and do not execute
authored JavaScript. MDX is executable JavaScript and should only be compiled
from authors trusted at that level, or processed inside an appropriately
isolated publishing pipeline.

React escapes text values, but host-supplied components and callbacks remain
host code. Validate URLs and structured JSON before passing them into custom
renderers.

## Reporting

Report suspected vulnerabilities privately through the repository's
[GitHub security page](https://github.com/postkit-org/postkit-js/security).
Do not include secrets or publish a proof of concept in a public issue.
