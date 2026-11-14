import { describe, expect, test } from 'bun:test';
import { matchesEmployeeSearch, sortEmployeesByName } from '../src/utils/employeeSearch';

const edgard = { first_name: 'Edgard', last_name: 'Conceição', position: 'Admin' };
const camila = { first_name: 'Camila', last_name: 'Lazzarotto', position: 'Coord' };
const luiz = { first_name: 'Luiz Gabriel', last_name: 'dos Reis', position: 'Labor' };
const teste = { first_name: 'teste 123', last_name: '', position: 'Testando' };

describe('Employee picker sorting', () => {
  test('sorts A–Z by full name, ignoring case', () => {
    const names = sortEmployeesByName([luiz, teste, edgard, camila]).map(e => e.first_name);
    expect(names).toEqual(['Camila', 'Edgard', 'Luiz Gabriel', 'teste 123']);
  });

  test('does not change the original list', () => {
    const list = [luiz, camila];
    sortEmployeesByName(list);
    expect(list[0]).toBe(luiz);
  });
});

describe('Employee picker search', () => {
  test('matches part of a first or last name', () => {
    expect(matchesEmployeeSearch(camila, 'cam')).toBe(true);
    expect(matchesEmployeeSearch(camila, 'lazz')).toBe(true);
    expect(matchesEmployeeSearch(camila, 'luiz')).toBe(false);
  });

  test('ignores accents and case', () => {
    expect(matchesEmployeeSearch(edgard, 'conceicao')).toBe(true);
    expect(matchesEmployeeSearch(edgard, 'CONCEIÇÃO')).toBe(true);
  });

  test('matches words in any order, including the trade', () => {
    expect(matchesEmployeeSearch(luiz, 'reis luiz')).toBe(true);
    expect(matchesEmployeeSearch(luiz, 'labor')).toBe(true);
    expect(matchesEmployeeSearch(luiz, 'luiz carpentry')).toBe(false);
  });

  test('an empty search shows everyone', () => {
    expect(matchesEmployeeSearch(camila, '   ')).toBe(true);
  });
});
