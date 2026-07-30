# PostKit security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's
**Report a vulnerability** action on the
[`postkit-js` security page](https://github.com/postkit-org/postkit-js/security)
to create a private security advisory.

Include:

- The affected package and version
- A minimal reproduction or proof of concept
- The expected and observed trust boundary
- The practical impact
- Any known mitigation

Please avoid accessing data that does not belong to you, disrupting services,
or publishing the report before a fix and disclosure plan are available.

## Supported versions

PostKit is in its initial pre-1.0 release series. Security fixes target the
latest published release. Older releases may receive a backport when the fix is
low risk, but consumers should plan to upgrade.

| Release       | Security fixes |
| ------------- | -------------- |
| Latest `0.x`  | Supported      |
| Earlier `0.x` | Best effort    |

## Trust boundaries

- `@postkit/unfurl` belongs in a server, build process, or trusted editor.
  Provider keys must never enter a browser bundle.
- Treat authored URLs as untrusted. Applications that fetch origins directly
  must enforce allowed protocols, redirect limits, timeouts, response-size
  limits, and private-network protections.
- Provider `embed.rawHtml` is untrusted. PostKit's React renderer does not
  inject it; a host that uses it owns sanitization and isolation.
- Normalized metadata and saved social snapshots remain untrusted content and
  must be rendered through escaping component boundaries.
- Plain Markdown directives accept allowlisted literal data and do not execute
  authored JavaScript.
- Host-supplied MDX components, resolver callbacks, iframe policies, and media
  pipelines are outside PostKit's trust boundary.

See the [security guide](apps/site/content/docs/security.md) for integration
guidance.
