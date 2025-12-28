interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (connection/timeout errors)
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const errorMessage = (error as Error).message?.toLowerCase() || "";

  // Common retryable database errors
  const retryablePatterns = [
    "connection terminated",
    "connection closed",
    "connection timeout",
    "connection refused",
    "econnrefused",
    "econnreset",
    "etimedout",
    "socket hang up",
    "network error",
    "too many connections",
    "connection pool timeout",
    "expired transaction",
    "transaction timeout",
    "transaction api error",
  ];

  return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Log retry attempt
      console.warn(
        `Database operation failed (attempt ${attempt}/${opts.maxAttempts}), retrying in ${delay}ms...`,
        error
      );

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  // All retries failed
  throw lastError;
}
