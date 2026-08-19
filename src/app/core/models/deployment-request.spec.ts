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

import {
  decodeFileData,
  encodeFileData,
  ModuleConfigValue,
  parseModuleConfigValue
} from './deployment-request';

function config(overrides: Partial<ModuleConfigValue> = {}): ModuleConfigValue {
  return {
    default: null,
    options: null,
    opt_ext: false,
    type: 'text',
    type_opt: null,
    data_type: 'string',
    is_slice: false,
    ...overrides,
  };
}

describe('parseModuleConfigValue', () => {
  it('applies the number constraints from the type options', () => {
    const c = config({type: 'number', data_type: 'int', type_opt: {min: 1, max: 10}});
    expect(parseModuleConfigValue(c, '5')).toBe(5);
    expect(() => parseModuleConfigValue(c, '0')).toThrow();
    expect(() => parseModuleConfigValue(c, '11')).toThrow();
    expect(() => parseModuleConfigValue(c, '2.5')).toThrow();
  });

  it('applies the text constraints from the type options', () => {
    const c = config({type_opt: {min_len: 3, max_len: 5, regex: '^[a-z]+$'}});
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
    const c = config({data_type: 'int', is_slice: true, type_opt: {max: 10}});
    expect(parseModuleConfigValue(c, '1\n2\n3')).toEqual([1, 2, 3]);
    expect(() => parseModuleConfigValue(c, '1\n11')).toThrow();
    expect(() => parseModuleConfigValue(c, '')).toThrow();
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
