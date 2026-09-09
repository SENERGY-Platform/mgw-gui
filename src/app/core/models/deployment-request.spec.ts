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
  ModuleInputs,
  moduleInputGroupLabel,
  parseModuleConfigValue,
} from './deployment-request';

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

describe('moduleInputGroupLabel', () => {
  function inputs(groups: ModuleInputs['groups']): ModuleInputs {
    return {resources: null, secrets: null, configs: null, files: null, file_groups: null, groups: groups};
  }

  it('walks the parents into one path', () => {
    const meta = inputs({
      broker: {name: 'Broker', description: '', group: ''},
      advanced: {name: 'Advanced', description: '', group: 'broker'},
    });

    expect(moduleInputGroupLabel(meta, 'advanced')).toBe('Broker / Advanced');
    expect(moduleInputGroupLabel(meta, 'broker')).toBe('Broker');
  });

  it('is empty for an input that belongs to no group, or to one the module does not declare', () => {
    expect(moduleInputGroupLabel(inputs(null), '')).toBe('');
    expect(moduleInputGroupLabel(inputs({}), 'gone')).toBe('');
    expect(moduleInputGroupLabel(undefined, 'any')).toBe('');
  });

  // Groups point at their parent by reference, so a cycle would otherwise
  // never return. The cap is what makes the walk safe to run on any payload.
  it('gives up on a cycle instead of hanging', () => {
    const meta = inputs({
      a: {name: 'A', description: '', group: 'b'},
      b: {name: 'B', description: '', group: 'a'},
    });

    expect(moduleInputGroupLabel(meta, 'a').split(' / ').length).toBe(10);
  });
});
