import { describe, expect, it } from 'vitest';
import {
  calculatePasswordStrength,
  formatBrazilianMobilePhone,
  isValidBrazilianMobilePhone,
  isValidEmail,
  sortContactsByMostRecent,
  toBrazilianE164Phone,
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

  it('remove máscara e gera telefone no formato +xxxxxxxxxxxxx para payload', () => {
    expect(toBrazilianE164Phone('+55 (81) 99723-6704')).toBe('+5581997236704');
    expect(toBrazilianE164Phone('81997236704')).toBe('+5581997236704');
  });

  it('calcula a força da senha do cadastro', () => {
    expect(calculatePasswordStrength('').level).toBe('empty');
    expect(calculatePasswordStrength('abc').level).toBe('very-weak');
    expect(calculatePasswordStrength('abc12345').level).toBe('weak');
    expect(calculatePasswordStrength('User@123456').level).toBe('strong');
    expect(calculatePasswordStrength('User@12345678').level).toBe('very-strong');
  });

  it('ordena contatos por data de criação mais recente quando disponível', () => {
    const contacts = [
      { id: 'older', name: 'Older', createdAt: '2026-05-10T10:00:00.000Z' },
      { id: 'newer', name: 'Newer', createdAt: '2026-05-15T10:00:00.000Z' },
      { id: 'middle', name: 'Middle', createdAt: '2026-05-12T10:00:00.000Z' },
    ];

    expect(sortContactsByMostRecent(contacts).map((contact) => contact.id)).toEqual([
      'newer',
      'middle',
      'older',
    ]);
  });

  it('promove contatos marcados como recentes quando não há data de criação', () => {
    const contacts = [
      { id: 'first', name: 'First' },
      { id: 'second', name: 'Second' },
      { id: 'third', name: 'Third' },
    ];

    expect(sortContactsByMostRecent(contacts, ['third']).map((contact) => contact.id)).toEqual([
      'third',
      'first',
      'second',
    ]);
  });
});
