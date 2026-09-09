/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {decodeFileData, encodeFileData, ModuleConfigValue, parseModuleConfigValue} from './deployment-request';

// type_opt entries arrive wrapped in {value, data_type}, never as bare values
function typeOpts(entries: Record<string, [unknown, string]>) {
  return Object.fromEntries(Object.entries(entries).map(([k, [v, t]]) => [k, {value: v, data_type: t}]));
}

function config(overrides: Partial<ModuleConfigValue> = {}): ModuleConfigValue {
  return {
    default: null,
    options: null,
    opt_ext: false,
    type: 'text',
    type_opt: null,
    data_type: 'string',
    is_slice: false,
    required: false,
    ...overrides,
  };
}

describe('parseModuleConfigValue', () => {
  it('applies the number constraints from the type options', () => {
    const c = config({type: 'number', data_type: 'int', type_opt: typeOpts({min: [1, 'int'], max: [10, 'int']})});
    expect(parseModuleConfigValue(c, '5')).toBe(5);
    expect(() => parseModuleConfigValue(c, '0')).toThrow();
    expect(() => parseModuleConfigValue(c, '11')).toThrow();
    expect(() => parseModuleConfigValue(c, '2.5')).toThrow();
  });

  it('applies the text constraints from the type options', () => {
    const c = config({
      type_opt: typeOpts({min_len: [3, 'int'], max_len: [5, 'int'], regex: ['^[a-z]+$', 'string']}),
    });
    expect(parseModuleConfigValue(c, 'abc')).toBe('abc');
    expect(() => parseModuleConfigValue(c, 'ab')).toThrow();
    expect(() => parseModuleConfigValue(c, 'abcdef')).toThrow();
    expect(() => parseModuleConfigValue(c, 'ABC')).toThrow();
  });

  it('rejects values outside the options unless opt_ext allows them', () => {
    const restricted = config({options: ['a', 'b']});
    expect(parseModuleConfigValue(restricted, 'a')).toBe('a');
    expect(() => parseModuleConfigValue(restricted, 'c')).toThrow();
    const extendable = config({options: ['a', 'b'], opt_ext: true});
    expect(parseModuleConfigValue(extendable, 'c')).toBe('c');
  });

  it('parses slices line by line and validates every item', () => {
    const c = config({data_type: 'int', is_slice: true, type_opt: typeOpts({max: [10, 'int']})});
    expect(parseModuleConfigValue(c, '1\n2\n3')).toEqual([1, 2, 3]);
    expect(() => parseModuleConfigValue(c, '1\n11')).toThrow();
    expect(() => parseModuleConfigValue(c, '')).toThrow();
  });

  // SNRGY-4691: reading a type_opt entry without unwrapping turned every
  // constraint into a check against the string "[object Object]", which the
  // module default of a restricted config could fail while other options
  // happened to pass.
  it('accepts a default that satisfies a regex constraint', () => {
    const c = config({
      default: 'warning',
      options: ['debug', 'info', 'warning', 'error'],
      type_opt: typeOpts({min_len: [4, 'int'], max_len: [16, 'int'], regex: ['^[a-z]+$', 'string']}),
      required: true,
    });
    expect(parseModuleConfigValue(c, 'warning')).toBe('warning');
    expect(parseModuleConfigValue(c, 'debug')).toBe('debug');
  });

  it('parses booleans', () => {
    const c = config({data_type: 'bool'});
    expect(parseModuleConfigValue(c, 'true')).toBe(true);
    expect(() => parseModuleConfigValue(c, 'maybe')).toThrow();
  });
});

describe('file data encoding', () => {
  it('round-trips utf-8 content through base64', () => {
    const text = 'käse: über\nzeile 2 🚀';
    expect(decodeFileData(encodeFileData(text))).toBe(text);
  });

  it('decodes empty data to an empty string', () => {
    expect(decodeFileData('')).toBe('');
  });
});
