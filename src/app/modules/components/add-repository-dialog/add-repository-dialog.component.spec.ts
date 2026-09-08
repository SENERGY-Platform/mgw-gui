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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {TranslocoService} from '@jsverse/transloco';
import {firstValueFrom} from 'rxjs';
import type {Mock} from 'vitest';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {AddRepositoryDialogComponent} from './add-repository-dialog.component';

// The definition reaches the module-manager verbatim, and a definition it
// cannot use fails quietly: the refresh reports success and the repository
// contributes no modules. What the dialog can check before that happens is
// that there is a definition at all and that it parses.
describe('AddRepositoryDialogComponent', () => {
  let fixture: ComponentFixture<AddRepositoryDialogComponent>;
  let close: Mock;

  // The messages below are resolved through TranslocoService in TypeScript,
  // so the scope has to be loaded before save() runs. In the app the dialog
  // opens long after the scope arrived.
  async function create(): Promise<AddRepositoryDialogComponent> {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [AddRepositoryDialogComponent, provideTranslocoTesting('modules')],
      providers: [provideNoopAnimations(), {provide: MatDialogRef, useValue: {close: close}}],
    });
    await firstValueFrom(TestBed.inject(TranslocoService).load('modules/en'));
    fixture = TestBed.createComponent(AddRepositoryDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('starts with an empty definition', async () => {
    expect((await create()).definitionJson).toBe('');
  });

  it('shows the expected shape as a placeholder, without submitting it', async () => {
    const component = await create();

    const textarea = fixture.nativeElement.querySelector('textarea.definition') as HTMLTextAreaElement;
    const placeholder = JSON.parse(textarea.placeholder);

    expect(Object.keys(placeholder)).toEqual(['owner', 'repository', 'reference', 'priority', 'channels']);
    expect(component.definitionJson).toBe('');
  });

  it('does not submit an empty definition, and says why', async () => {
    const component = await create();

    component.save();

    expect(close).not.toHaveBeenCalled();
    expect(component.error).not.toBe('');
  });

  it('does not submit a definition that is not JSON, and says why', async () => {
    const component = await create();
    component.definitionJson = '{owner: SENERGY-Platform}';

    component.save();

    expect(close).not.toHaveBeenCalled();
    expect(component.error).toContain('Invalid JSON');
  });

  it('closes with the type and the parsed definition', async () => {
    const component = await create();
    component.definitionJson = '{"owner": "SENERGY-Platform", "repository": "mgw-module-repository"}';

    component.save();

    expect(close).toHaveBeenCalledWith({
      type: 'github.com',
      definition: {owner: 'SENERGY-Platform', repository: 'mgw-module-repository'},
    });
  });

  it('clears an earlier error once a valid definition is submitted', async () => {
    const component = await create();
    component.save();
    expect(component.error).not.toBe('');

    component.definitionJson = '{}';
    component.save();

    expect(component.error).toBe('');
  });
});
