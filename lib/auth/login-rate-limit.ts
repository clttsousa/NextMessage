type Entry = { attempts: number; blockedUntil: number; firstAttemptAt: number };

const attemptsByKey = new Map<string, Entry>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function now() {
  return Date.now();
}

export function getLoginThrottle(key: string) {
  const entry = attemptsByKey.get(key);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };

  if (entry.blockedUntil > now()) {
    return { blocked: true, retryAfterSeconds: Math.ceil((entry.blockedUntil - now()) / 1000) };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerLoginFailure(key: string) {
  const current = attemptsByKey.get(key);
  const currentTime = now();

  if (!current || currentTime - current.firstAttemptAt > WINDOW_MS) {
    attemptsByKey.set(key, { attempts: 1, blockedUntil: 0, firstAttemptAt: currentTime });
    return;
  }

  const attempts = current.attempts + 1;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? currentTime + BLOCK_MS : 0;
  attemptsByKey.set(key, { attempts, blockedUntil, firstAttemptAt: current.firstAttemptAt });
}

export function registerLoginSuccess(key: string) {
  attemptsByKey.delete(key);
}
