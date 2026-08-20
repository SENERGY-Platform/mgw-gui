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

import {SwaggerDocument, flattenOperations, sampleFor} from './openapi';

function doc(overrides: Partial<SwaggerDocument> = {}): SwaggerDocument {
  return {
    swagger: '2.0',
    host: '',
    basePath: '/',
    paths: {},
    ...overrides,
  };
}

describe('flattenOperations', () => {
  it('returns one entry per path and method', () => {
    const operations = flattenOperations(doc({
      paths: {
        '/secrets': {
          get: {summary: 'Get secrets', tags: ['Secrets']},
          post: {summary: 'Create secret', tags: ['Secrets']},
        },
        '/info': {get: {summary: 'Get info', tags: ['Info']}},
      },
    }));

    expect(operations.length).toBe(3);
    expect(operations.map(o => o.method + ' ' + o.path).sort())
      .toEqual(['GET /info', 'GET /secrets', 'POST /secrets']);
  });

  it('ignores keys that are not http methods', () => {
    const operations = flattenOperations(doc({
      paths: {'/secrets': {get: {summary: 'Get'}, parameters: <any>[]}},
    }));

    expect(operations.length).toBe(1);
  });

  it('falls back to the path when an operation has no summary and to Other without a tag', () => {
    const operations = flattenOperations(doc({paths: {'/key': {post: {}}}}));

    expect(operations[0].summary).toBe('/key');
    expect(operations[0].tag).toBe('Other');
  });
});

describe('sampleFor', () => {
  it('builds an object from the declared properties', () => {
    const sample = sampleFor({
      type: 'object',
      properties: {name: {type: 'string'}, port: {type: 'integer'}, enabled: {type: 'boolean'}},
    }, doc());

    expect(sample).toEqual({name: '', port: 0, enabled: false});
  });

  it('resolves a $ref through the document definitions', () => {
    const document = doc({definitions: {'lib.Secret': {type: 'object', properties: {id: {type: 'string'}}}}});

    expect(sampleFor({$ref: '#/definitions/lib.Secret'}, document)).toEqual({id: ''});
  });

  it('stops at a definition that references itself', () => {
    const document = doc({
      definitions: {
        'lib.Node': {type: 'object', properties: {child: {$ref: '#/definitions/lib.Node'}}},
      },
    });

    expect(sampleFor({$ref: '#/definitions/lib.Node'}, document)).toEqual({child: {}});
  });

  it('wraps the item sample in an array', () => {
    expect(sampleFor({type: 'array', items: {type: 'string'}}, doc())).toEqual(['']);
  });

  it('prefers the first enum value', () => {
    expect(sampleFor({type: 'string', enum: ['safe', 'fast']}, doc())).toBe('safe');
  });

  it('returns null without a schema', () => {
    expect(sampleFor(undefined, doc())).toBeNull();
  });
});
