import { describe, expect, it } from 'vitest';
import {
  evaluatePasswordPolicy,
  getPasswordPolicyError,
  isPasswordValid,
} from './passwordPolicy';

describe('passwordPolicy', () => {
  it('accepts a compliant strong password', () => {
    expect(isPasswordValid('LydiaCare#2026')).toBe(true);
    expect(getPasswordPolicyError('LydiaCare#2026')).toBeNull();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(isPasswordValid('Ab1!xyz')).toBe(false);
    expect(evaluatePasswordPolicy('Ab1!xyz').minLength).toBe(false);
  });

  it('rejects missing uppercase, lowercase, number, or special character', () => {
    expect(isPasswordValid('lowercase1!')).toBe(false);
    expect(isPasswordValid('UPPERCASE1!')).toBe(false);
    expect(isPasswordValid('NoNumbers!!')).toBe(false);
    expect(isPasswordValid('NoSpecial123')).toBe(false);
  });

  it('rejects whitespace inside passwords', () => {
    expect(isPasswordValid('Lydia Care#2026')).toBe(false);
    expect(getPasswordPolicyError('Lydia Care#2026')).toContain('no spaces');
  });
});
