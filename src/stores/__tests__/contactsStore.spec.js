import { describe, expect, it } from 'vitest';
import {
  formatBrazilianMobilePhone,
  isValidBrazilianMobilePhone,
  isValidEmail,
} from '../contactsStore';

describe('contactsStore validators', () => {
  it('valida formato de e-mail', () => {
    expect(isValidEmail('ana@email.com')).toBe(true);
    expect(isValidEmail('ana.silva+teste@sub.email.com.br')).toBe(true);
    expect(isValidEmail('email-invalido')).toBe(false);
    expect(isValidEmail('ana@')).toBe(false);
    expect(isValidEmail('ana@email')).toBe(false);
  });

  it('formata e valida telefone brasileiro no padrão +55 (xx) xxxxx-xxxx', () => {
    expect(formatBrazilianMobilePhone('11999990000')).toBe('+55 (11) 99999-0000');
    expect(formatBrazilianMobilePhone('81997236704')).toBe('+55 (81) 99723-6704');
    expect(formatBrazilianMobilePhone('+55 (81) 99723-6704')).toBe('+55 (81) 99723-6704');
    expect(isValidBrazilianMobilePhone('+55 (11) 99999-0000')).toBe(true);
    expect(isValidBrazilianMobilePhone('11999990000')).toBe(true);
    expect(isValidBrazilianMobilePhone('+55 (11) 9999-0000')).toBe(false);
    expect(isValidBrazilianMobilePhone('119999')).toBe(false);
  });
});
