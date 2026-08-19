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
  DATA_TYPE_BOOL,
  DATA_TYPE_FLOAT,
  DATA_TYPE_INT,
  DATA_TYPE_STRING,
  formatConfigValue,
  parseConfigValue
} from './global-configs';

describe('parseConfigValue', () => {
  it('should keep strings as strings', () => {
    expect(parseConfigValue(DATA_TYPE_STRING, false, ' hello ')).toBe('hello');
    expect(parseConfigValue(DATA_TYPE_STRING, false, '42')).toBe('42');
  });

  it('should parse integers as JSON numbers', () => {
    expect(parseConfigValue(DATA_TYPE_INT, false, '42')).toBe(42);
    expect(parseConfigValue(DATA_TYPE_INT, false, '-7')).toBe(-7);
  });

  it('should reject non-integer input for int configs', () => {
    expect(() => parseConfigValue(DATA_TYPE_INT, false, '4.2')).toThrow();
    expect(() => parseConfigValue(DATA_TYPE_INT, false, 'abc')).toThrow();
    expect(() => parseConfigValue(DATA_TYPE_INT, false, '')).toThrow();
  });

  it('should parse floats as JSON numbers', () => {
    expect(parseConfigValue(DATA_TYPE_FLOAT, false, '0.5')).toBe(0.5);
    expect(parseConfigValue(DATA_TYPE_FLOAT, false, '3')).toBe(3);
  });

  it('should parse booleans', () => {
    expect(parseConfigValue(DATA_TYPE_BOOL, false, 'true')).toBe(true);
    expect(parseConfigValue(DATA_TYPE_BOOL, false, 'false')).toBe(false);
    expect(() => parseConfigValue(DATA_TYPE_BOOL, false, 'yes')).toThrow();
  });

  it('should parse slices from one value per line', () => {
    expect(parseConfigValue(DATA_TYPE_INT, true, '1\n2\n\n3\n')).toEqual([1, 2, 3]);
    expect(parseConfigValue(DATA_TYPE_STRING, true, 'a\nb')).toEqual(['a', 'b']);
  });

  it('should reject empty slices and invalid slice items', () => {
    expect(() => parseConfigValue(DATA_TYPE_INT, true, '\n\n')).toThrow();
    expect(() => parseConfigValue(DATA_TYPE_INT, true, '1\nx')).toThrow();
  });
});

describe('formatConfigValue', () => {
  it('should render single values as strings', () => {
    expect(formatConfigValue({data_type: DATA_TYPE_INT, is_slice: false, value: 42})).toBe('42');
    expect(formatConfigValue({data_type: DATA_TYPE_BOOL, is_slice: false, value: false})).toBe('false');
  });

  it('should render slices one item per line', () => {
    expect(formatConfigValue({data_type: DATA_TYPE_INT, is_slice: true, value: [1, 2]})).toBe('1\n2');
  });

  it('should render null values as empty string', () => {
    expect(formatConfigValue({data_type: DATA_TYPE_STRING, is_slice: false, value: null})).toBe('');
  });
});
