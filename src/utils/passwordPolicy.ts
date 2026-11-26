export interface PasswordPolicyEvaluation {
  minLength: boolean;
  maxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  noWhitespace: boolean;
}

export const PASSWORD_RULE_ITEMS: Array<{
  key: keyof PasswordPolicyEvaluation;
  label: string;
}> = [
  { key: 'minLength', label: 'At least 8 characters (max 100)' },
  { key: 'hasUppercase', label: 'At least 1 uppercase letter (A–Z)' },
  { key: 'hasLowercase', label: 'At least 1 lowercase letter (a–z)' },
  { key: 'hasNumber', label: 'At least 1 number (0–9)' },
  { key: 'hasSpecial', label: 'At least 1 special character (e.g. !@#$%)' },
  { key: 'noWhitespace', label: 'No spaces or whitespace' },
];

export function evaluatePasswordPolicy(password: string): PasswordPolicyEvaluation {
  return {
    minLength: password.length >= 8,
    maxLength: password.length <= 100,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
    noWhitespace: !/\s/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const result = evaluatePasswordPolicy(password);
  return Object.values(result).every(Boolean);
}

export function getPasswordPolicyError(password: string): string | null {
  const result = evaluatePasswordPolicy(password);
  const missing: string[] = [];

  if (!result.minLength) missing.push('at least 8 characters');
  if (!result.maxLength) missing.push('at most 100 characters');
  if (!result.noWhitespace) missing.push('no spaces');
  if (!result.hasUppercase) missing.push('an uppercase letter');
  if (!result.hasLowercase) missing.push('a lowercase letter');
  if (!result.hasNumber) missing.push('a number');
  if (!result.hasSpecial) missing.push('a special character');

  if (missing.length === 0) {
    return null;
  }

  return `Password must include ${missing.join(', ')}.`;
}
