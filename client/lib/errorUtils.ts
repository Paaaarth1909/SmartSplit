/**
 * Safely parses and formats any error into a clean, human-readable message.
 * Strips raw JSON (like Google GenAI {"error":{"code":503,"message":"..."}}),
 * stack traces, code breaks, and returns friendly, actionable feedback.
 */
export function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  let raw = '';

  if (typeof error === 'string') {
    raw = error;
  } else if (typeof error === 'object') {
    if (error.message && typeof error.message === 'string') {
      raw = error.message;
    } else if (error.error) {
      if (typeof error.error === 'string') {
        raw = error.error;
      } else if (error.error.message) {
        raw = error.error.message;
      } else {
        try {
          raw = JSON.stringify(error.error);
        } catch {
          raw = 'An error occurred';
        }
      }
    } else {
      try {
        raw = JSON.stringify(error);
      } catch {
        raw = 'An error occurred';
      }
    }
  }

  // Attempt to parse if string is JSON (e.g. {"error":{"code":503,"message":"..."}})
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.error) {
        if (typeof parsed.error === 'string') {
          raw = parsed.error;
        } else if (parsed.error.message) {
          raw = parsed.error.message;
        }
      } else if (parsed.message) {
        raw = parsed.message;
      }
    } catch {
      // Not JSON, continue with raw
    }
  }

  const lower = (raw || '').toLowerCase();

  // Handle specific common AI and network scenarios with friendly human messages
  if (
    lower.includes('high demand') || 
    lower.includes('unavailable') || 
    lower.includes('503') ||
    lower.includes('overloaded')
  ) {
    return 'The AI service is currently experiencing high demand. Spikes in demand are usually temporary. Please try again in a moment, or enter details manually.';
  }

  if (
    lower.includes('rate limit') || 
    lower.includes('quota') || 
    lower.includes('429') ||
    lower.includes('resource_exhausted')
  ) {
    return 'AI request limit reached. Please wait a moment before trying again, or fill in details manually.';
  }

  if (
    lower.includes('failed to fetch') || 
    lower.includes('networkerror') || 
    lower.includes('connection refused') ||
    lower.includes('network request failed')
  ) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (lower.includes('duplicate') || lower.includes('already been uploaded')) {
    return 'This receipt has already been uploaded previously to this group.';
  }

  if (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('401')) {
    return 'Your session has expired. Please log in again to continue.';
  }

  if (lower.includes('no receipt image') || lower.includes('invalid file')) {
    return 'Please select a valid receipt image (JPG, PNG, or WebP).';
  }

  // Remove code stack trace and raw code syntax if present
  if (raw.includes('\n')) {
    raw = raw.split('\n')[0];
  }
  raw = raw.replace(/^Error:\s*/i, '').trim();

  // If after cleaning it's still looking like a JSON or code snippet
  if (raw.startsWith('{') || raw.startsWith('[')) {
    return 'Service encountered an issue processing your request. Please try again.';
  }

  return raw || 'An unexpected error occurred. Please try again.';
}
