import { BreadcrumbJsonLd as BreadcrumbSchema, Schema } from 'react-structured';

import {
  breadcrumbList,
  webSiteData,
  type Breadcrumb,
} from '../../lib/structured-data';

/**
 * The `WebSite` JSON-LD with its `SearchAction` (`/?q={search_term_string}`), 01 §7.
 * Render it on `/` only, in the page body (not inside `next/head`).
 */
export function WebSiteJsonLd() {
  return <Schema id="website-jsonld" type="WebSite" data={webSiteData()} />;
}

export interface BreadcrumbJsonLdProps {
  /** The crumbs after Home, ending with this page. Home is added for you. */
  readonly items: readonly Breadcrumb[];
}

/**
 * `BreadcrumbList` JSON-LD for any page except `/` (01 §7). Render it in the page body:
 * `<BreadcrumbJsonLd items={[{ name: 'Components', path: '/components' }, { name: 'Callout', path: '/components/callout' }]} />`.
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <BreadcrumbSchema id="breadcrumb-jsonld" data={breadcrumbList(items)} />
  );
}
