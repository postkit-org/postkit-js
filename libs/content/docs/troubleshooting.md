---
title: Troubleshooting
summary: Diagnose provider, theme, routing, hydration, directive, and remote metadata integration issues.
category: Help
order: 90
---

# Troubleshooting

## Components render without PostKit styling

Ensure the article is beneath `PostkitProvider`. If the application supplies a
custom Chakra system, pass it through PostKit's system helpers so the component
recipes are registered.

## Internal links reload the page

Use the framework adapter rather than the base React MDX map. Render the article
beneath the router provider and verify that the destination is considered an
internal URL by the adapter.

## A plain Markdown directive is ignored

Enable PostKit's Remark plugins and use the `postkit-` directive name. Use JSX
instead of directive brace syntax inside MDX files.

## Astro hydration fails

Confirm that the React and MDX integrations are enabled and that a custom Chakra
system is exported from a module addressable by both server rendering and
hydrated islands.

## Link previews do not resolve

Run the resolver on a server or at build time. Check the provider configuration,
URL policy, response contract, and cache independently from the rendering
component.

When reporting an issue, include the PostKit package version, framework and
runtime versions, a minimal content sample, and whether the failure occurs at
build time, server rendering, hydration, or client interaction.
