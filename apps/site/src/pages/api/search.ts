import { createSiteSearchHandler } from '@postkit/site-search';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getSiteSearch } from '../../lib/search-records';

/**
 * `GET /api/search?q=…&collection=…&limit=…` (PK-040, 01 §8). The engine and the Fetch
 * handler are created once per server process; the limits (128-character queries, at most
 * 20 results) and the 405 for other methods are `@chakra-docs/search/http`'s. Nothing is
 * logged: queries appear only in the host's standard request log.
 */
const handleSearch = createSiteSearchHandler(getSiteSearch());

export const config = {
  api: { bodyParser: false },
};

/**
 * Pages Router API routes get Node's request: hand the Fetch handler a `Request`. Every
 * other method reaches it as POST (the `Request` constructor rejects some, like TRACE), so
 * the handler answers them all with its 405.
 */
export default async function searchRoute(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const fetchResponse = await handleSearch(
    new Request(new URL(request.url ?? '/', 'http://localhost'), {
      method: request.method === 'GET' ? 'GET' : 'POST',
    }),
  );

  response.status(fetchResponse.status);
  fetchResponse.headers.forEach((value, key) => response.setHeader(key, value));
  response.send(await fetchResponse.text());
}
