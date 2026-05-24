import { formatCurrency, initials } from '../format';

describe('initials()', () => {
  it('собирает инициалы из имени и фамилии', () => {
    expect(initials('Иван', 'Петров')).toBe('ИП');
  });

  it('возвращает «?» при пустых значениях', () => {
    expect(initials(null, null)).toBe('?');
    expect(initials('', undefined)).toBe('?');
  });
});

describe('formatCurrency()', () => {
  it('форматирует сумму в валюте организации', () => {
    const result = formatCurrency(1500, 'THB', 'en');
    expect(result).toContain('1,500');
  });

  it('не падает на неизвестной валюте', () => {
    // @ts-expect-error — проверка устойчивости к некорректному входу
    expect(() => formatCurrency(100, 'XYZ', 'ru')).not.toThrow();
  });
});
