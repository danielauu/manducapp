export type FeedErrorCode =
  | 'out-of-range'
  | 'not-found'
  | 'bad-response'
  | 'rate-limited'
  | 'network';

export class FeedError extends Error {
  readonly code: FeedErrorCode;

  constructor(code: FeedErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'FeedError';
    this.code = code;
  }
}
