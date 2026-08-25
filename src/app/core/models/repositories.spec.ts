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

import {Repository} from './repositories';

// The module-manager used to serialize these structs without json tags, so
// they arrived in Go's capitalisation and the models mirrored that (SNRGY-4601).
// A field renamed on one side only is invisible to the compiler - the response
// is parsed as JSON, so a stale name simply reads undefined and the column
// renders empty. This pins the wire names against a captured response.
describe('Repository', () => {
  // GET /repositories, as the fixed module-manager returns it
  const wire = `[
    {
      "type": "host-dir",
      "source": "localhost",
      "priority": 0,
      "channels": [{"name": "default", "priority": 0}]
    }
  ]`;

  it('reads every field of a repository the module-manager sends', () => {
    const [repository] = JSON.parse(wire) as Repository[];

    expect(repository.type).toBe('host-dir');
    expect(repository.source).toBe('localhost');
    expect(repository.priority).toBe(0);
    expect(repository.channels.map((channel) => channel.name)).toEqual(['default']);
    expect(repository.channels[0].priority).toBe(0);
  });

  it('leaves nothing undefined that a template renders', () => {
    const [repository] = JSON.parse(wire) as Repository[];

    for (const [key, value] of Object.entries(repository)) {
      expect(value, `${key} is undefined - the model and the wire format disagree`).toBeDefined();
    }
  });
});
