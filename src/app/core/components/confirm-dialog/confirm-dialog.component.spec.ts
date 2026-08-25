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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {ConfirmDialogComponent} from './confirm-dialog.component';

/**
 * Stands in for the whole core area: this dialog's title and its two
 * buttons come from `assets/i18n/core/en.json` through the `transloco` pipe
 * rather than from a literal in the template, and the fixture below renders
 * with nothing but the real translation file behind it (via
 * provideTranslocoTesting) - so a rename of one of these keys in the JSON
 * without a matching template change would fail this spec.
 */
describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: {close: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    dialogRef = {close: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, provideTranslocoTesting('core')],
      providers: [
        provideNoopAnimations(),
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: MAT_DIALOG_DATA, useValue: {message: 'Remove this module?'}},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('renders its title and buttons through Transloco, not as literal template text', () => {
    expect(text()).toContain('Please confirm');
    expect(text()).toContain('Cancel');
    expect(text()).toContain('Confirm');
  });

  it('shows the caller-supplied message unchanged', () => {
    expect(text()).toContain('Remove this module?');
  });

  it('closes with false on cancel', () => {
    fixture.debugElement.nativeElement.querySelectorAll('button')[0].click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('closes with true on confirm', () => {
    fixture.debugElement.nativeElement.querySelectorAll('button')[1].click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
