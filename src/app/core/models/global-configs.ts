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

// Models of the next-gen module-manager global config API.
// Mirrors mgw-module-manager/lib/models/configs.go; field names follow the
// JSON tags of the Go structs.

export const DATA_TYPE_STRING = 1;
export const DATA_TYPE_INT = 2;
export const DATA_TYPE_FLOAT = 3;
export const DATA_TYPE_BOOL = 4;

export const DATA_TYPE_LABELS: Record<number, string> = {
  [DATA_TYPE_STRING]: "string",
  [DATA_TYPE_INT]: "int",
  [DATA_TYPE_FLOAT]: "float",
  [DATA_TYPE_BOOL]: "bool",
};

// DataType and IsSlice describe how Value is to be interpreted, they must
// match the type declared by the module config the value is used for.
export interface InterfaceValue {
  data_type: number;
  is_slice: boolean;
  value: any;
}

export interface GlobalConfig extends InterfaceValue {
  id: string;
  name: string;
}

export interface GlobalConfigInput extends InterfaceValue {
  name: string;
}

// Parses one raw input string into the JSON type the module-manager expects
// for the data type. Throws on invalid input so forms can surface the error.
export function parseConfigItem(dataType: number, raw: string): string | number | boolean {
  raw = raw.trim()
  switch (dataType) {
    case DATA_TYPE_STRING:
      return raw
    case DATA_TYPE_INT: {
      if (!/^[+-]?\d+$/.test(raw)) {
        throw new Error("'" + raw + "' is not an integer")
      }
      return Number(raw)
    }
    case DATA_TYPE_FLOAT: {
      if (raw === "" || isNaN(Number(raw))) {
        throw new Error("'" + raw + "' is not a number")
      }
      return Number(raw)
    }
    case DATA_TYPE_BOOL: {
      if (raw === "true") {
        return true
      }
      if (raw === "false") {
        return false
      }
      throw new Error("'" + raw + "' is not a boolean (use true or false)")
    }
    default:
      throw new Error("unknown data type " + dataType)
  }
}

// Parses the raw form input (one line per item for slices) into the value
// for a GlobalConfigInput. Throws on invalid input.
export function parseConfigValue(dataType: number, isSlice: boolean, raw: string): any {
  if (!isSlice) {
    return parseConfigItem(dataType, raw)
  }
  var items = raw.split("\n").map(line => line.trim()).filter(line => line !== "")
  if (items.length === 0) {
    throw new Error("a list needs at least one value (one per line)")
  }
  return items.map(item => parseConfigItem(dataType, item))
}

// Renders a stored value back into the form representation
// (one line per item for slices).
export function formatConfigValue(config: InterfaceValue): string {
  if (config.value === null || config.value === undefined) {
    return ""
  }
  if (config.is_slice && Array.isArray(config.value)) {
    return config.value.join("\n")
  }
  return String(config.value)
}
