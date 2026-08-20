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

// Subset of the Swagger 2.0 document the gateway services publish under
// /core/swagger/{scope}/{service}/doc.json. The documents carry host: "" and
// basePath: "/", so the base URL a request has to go to is not in the
// document - it comes from the API registry instead.

export interface SwaggerSchema {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  items?: SwaggerSchema;
  properties?: Record<string, SwaggerSchema>;
  required?: string[];
  additionalProperties?: SwaggerSchema | boolean;
  enum?: any[];
}

export interface SwaggerParameter {
  name: string;
  // path, query, body, header or formData
  in: string;
  description?: string;
  required?: boolean;
  type?: string;
  format?: string;
  items?: SwaggerSchema;
  collectionFormat?: string;
  schema?: SwaggerSchema;
  enum?: any[];
  default?: any;
}

export interface SwaggerResponse {
  description?: string;
  schema?: SwaggerSchema;
}

export interface SwaggerOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  consumes?: string[];
  produces?: string[];
  parameters?: SwaggerParameter[];
  responses?: Record<string, SwaggerResponse>;
}

export interface SwaggerInfo {
  title?: string;
  description?: string;
  version?: string;
}

export interface SwaggerDocument {
  swagger?: string;
  info?: SwaggerInfo;
  host?: string;
  basePath?: string;
  paths: Record<string, Record<string, SwaggerOperation>>;
  definitions?: Record<string, SwaggerSchema>;
}

// Flattened path + method pair, which is what the playground actually lists.
export interface ApiOperation {
  path: string;
  method: string;
  tag: string;
  summary: string;
  description: string;
  parameters: SwaggerParameter[];
  operation: SwaggerOperation;
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

export function flattenOperations(doc: SwaggerDocument): ApiOperation[] {
  const operations: ApiOperation[] = [];
  for (const [path, methods] of Object.entries(doc.paths || {})) {
    for (const method of METHODS) {
      const operation = methods[method];
      if (!operation) {
        continue;
      }
      operations.push({
        path: path,
        method: method.toUpperCase(),
        tag: operation.tags?.[0] || 'Other',
        summary: operation.summary || path,
        description: operation.description || '',
        parameters: operation.parameters || [],
        operation: operation,
      });
    }
  }
  return operations;
}

/**
 * Builds a sample body from a schema so the request editor starts from
 * something valid rather than an empty box. $refs are followed through the
 * document's definitions; a cycle stops at the repeated definition.
 */
export function sampleFor(schema: SwaggerSchema | undefined, doc: SwaggerDocument, seen: string[] = []): any {
  if (!schema) {
    return null;
  }
  if (schema.$ref) {
    const name = schema.$ref.replace('#/definitions/', '');
    if (seen.includes(name)) {
      return {};
    }
    const resolved = doc.definitions?.[name];
    return resolved ? sampleFor(resolved, doc, [...seen, name]) : {};
  }
  if (schema.enum?.length) {
    return schema.enum[0];
  }
  switch (schema.type) {
    case 'array':
      return [sampleFor(schema.items, doc, seen)];
    case 'object':
    case undefined:
      if (schema.properties) {
        const object: Record<string, any> = {};
        for (const [key, value] of Object.entries(schema.properties)) {
          object[key] = sampleFor(value, doc, seen);
        }
        return object;
      }
      return {};
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return '';
  }
}
