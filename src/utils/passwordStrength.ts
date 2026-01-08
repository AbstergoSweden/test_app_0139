/**
 * Password strength validation using zxcvbn library.
 */
import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  label: string;
  color: string;
  feedback: string[];
  isAcceptable: boolean; // true if score >= 2
}

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Very Weak', color: 'bg-red-500' },
  1: { label: 'Weak', color: 'bg-orange-500' },
  2: { label: 'Fair', color: 'bg-yellow-500' },
  3: { label: 'Strong', color: 'bg-lime-500' },
  4: { label: 'Very Strong', color: 'bg-green-500' },
};

/**
 * Evaluates password strength and returns detailed feedback.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'bg-gray-500',
      feedback: ['Enter a password'],
      isAcceptable: false,
    };
  }

  const result = zxcvbn(password);
  const { label, color } = SCORE_LABELS[result.score];
  
  const feedback: string[] = [];
  
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  
  feedback.push(...result.feedback.suggestions);
  
  // Add custom suggestions if feedback is empty
  if (feedback.length === 0 && result.score < 3) {
    if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('Add numbers');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Add special characters');
    }
  }

  return {
    score: result.score,
    label,
    color,
    feedback,
    isAcceptable: result.score >= 2,
  };
}

/**
 * Minimum acceptable password strength score (0-4).
 * Score 2 = "Fair" - reasonable balance between security and usability.
 */
export const MIN_PASSWORD_SCORE = 2;
