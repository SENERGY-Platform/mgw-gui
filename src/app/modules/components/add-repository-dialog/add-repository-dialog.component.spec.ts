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

import {TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {provideNoopAnimations} from '@angular/platform-browser/animations';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {AddRepositoryDialogComponent} from './add-repository-dialog.component';

// The prefilled definition is configuration, and configuration goes stale
// without anything noticing: the module-manager accepts a reference that does
// not resolve, reports the refresh as successful, and the repository simply
// contributes no modules. Pinning the values is the only thing between a
// changed upstream layout and a catalogue that is quietly empty.
describe('AddRepositoryDialogComponent', () => {
  function create(): AddRepositoryDialogComponent {
    TestBed.configureTestingModule({
      imports: [AddRepositoryDialogComponent, provideTranslocoTesting('modules')],
      providers: [provideNoopAnimations(), {provide: MatDialogRef, useValue: {close: () => undefined}}],
    });
    return TestBed.createComponent(AddRepositoryDialogComponent).componentInstance;
  }

  it('prefills the module repository as SNRGY-4631 specifies it', () => {
    const definition = JSON.parse(create().definitionJson);

    expect(definition.owner).toBe('SENERGY-Platform');
    expect(definition.repository).toBe('mgw-module-repository');
    // a tag; 'refs/heads/main-validated' does not resolve and fails silently
    expect(definition.reference).toBe('main-validated');
    expect(definition.priority).toBe(100);
  });

  it('offers every channel the repository has, in priority order', () => {
    const definition = JSON.parse(create().definitionJson);

    expect(definition.channels).toEqual([
      {name: 'main', priority: 2},
      {name: 'testing', priority: 1},
      {name: 'legacy', priority: 0},
    ]);
  });

  it('carries no blacklist, which this repository does not need', () => {
    const definition = JSON.parse(create().definitionJson);

    for (const channel of definition.channels) {
      expect(channel.blacklist).toBeUndefined();
    }
  });
});
