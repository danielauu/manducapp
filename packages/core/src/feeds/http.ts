import { FeedError } from '../errors';

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

/** Subconjunto de `fetch` que usan los feeds; así el núcleo no depende del DOM ni de Node. */
export type FetchLike = (url: string) => Promise<FetchResponseLike>;

export async function getText(fetchFn: FetchLike, url: string): Promise<string> {
  let response: FetchResponseLike;
  try {
    response = await fetchFn(url);
  } catch (cause) {
    throw new FeedError('network', `No se pudo conectar con ${url}`, { cause });
  }
  if (!response.ok) {
    throw new FeedError('bad-response', `HTTP ${response.status} desde ${url}`);
  }
  return response.text();
}
