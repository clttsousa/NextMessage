import { describe, expect, it } from 'vitest';
import { getLoginThrottle, registerLoginFailure, registerLoginSuccess } from '@/lib/auth/login-rate-limit';

describe('login rate limit', () => {
  it('bloqueia após repetidas falhas', () => {
    const key = 'usuario@teste.com';
    registerLoginSuccess(key);

    for (let i = 0; i < 5; i++) registerLoginFailure(key);

    const throttle = getLoginThrottle(key);
    expect(throttle.blocked).toBe(true);
    expect(throttle.retryAfterSeconds).toBeGreaterThan(0);
  });
});
