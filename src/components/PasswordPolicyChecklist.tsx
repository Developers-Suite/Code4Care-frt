import { Check, Circle } from 'lucide-react';
import { evaluatePasswordPolicy, PASSWORD_RULE_ITEMS } from '@/utils/passwordPolicy';

interface PasswordPolicyChecklistProps {
  password: string;
  confirmPassword?: string;
}

export function PasswordPolicyChecklist({
  password,
  confirmPassword,
}: PasswordPolicyChecklistProps) {
  const evalResult = evaluatePasswordPolicy(password);
  const showMatchRule = confirmPassword !== undefined;
  const passwordsMatch = showMatchRule && password.length > 0 && password === confirmPassword;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        Password requirements
      </p>
      {PASSWORD_RULE_ITEMS.map((rule) => {
        const passed = rule.key === 'minLength'
          ? evalResult.minLength && evalResult.maxLength
          : evalResult[rule.key];
        return (
          <div
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              passed ? 'text-emerald-700' : 'text-gray-500'
            }`}
          >
            {passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            )}
            <span>{rule.label}</span>
          </div>
        );
      })}
      {showMatchRule && (
        <div
          className={`flex items-center gap-2 text-xs pt-0.5 border-t border-gray-200/70 transition-colors ${
            passwordsMatch ? 'text-emerald-700' : 'text-gray-500'
          }`}
        >
          {passwordsMatch ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span>Passwords match</span>
        </div>
      )}
    </div>
  );
}
