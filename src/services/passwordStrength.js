export const PASSWORD_MIN_LENGTH = 8;

export function calculatePasswordStrength(value = '') {
  const password = String(value);

  if (!password) {
    return {
      level: 'empty',
      label: 'Sem senha',
      percent: 0,
      score: 0,
    };
  }

  const checks = [
    password.length >= PASSWORD_MIN_LENGTH,
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  let score = checks.filter(Boolean).length;

  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(1, score - 1);
  }

  if (/^(?:12345678|password|senha|qwerty)/i.test(password)) {
    score = Math.min(score, 1);
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      level: 'very-weak',
      label: 'Muito fraca',
      percent: 20,
      score,
    };
  }

  if (score <= 3) {
    return {
      level: 'weak',
      label: 'Fraca',
      percent: 40,
      score,
    };
  }

  if (score === 4) {
    return {
      level: 'medium',
      label: 'Média',
      percent: 60,
      score,
    };
  }

  if (score === 5) {
    return {
      level: 'strong',
      label: 'Forte',
      percent: 80,
      score,
    };
  }

  return {
    level: 'very-strong',
    label: 'Muito forte',
    percent: 100,
    score,
  };
}
