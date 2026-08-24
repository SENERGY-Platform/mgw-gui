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
import {TELEMETRY_LEVEL_OPTIONS, TelemetryLevel, telemetryConsent} from '../../services/telemetry/telemetry-consent';
import {TelemetryConsentService} from '../../services/telemetry/telemetry-consent.service';
import {TelemetryConsentDialogComponent} from './telemetry-consent-dialog.component';

const STORAGE_KEY = 'mgw-telemetry-consent';

describe('TelemetryConsentDialogComponent', () => {
  let fixture: ComponentFixture<TelemetryConsentDialogComponent>;
  let closed: TelemetryLevel | undefined | 'not closed';
  let service: TelemetryConsentService;

  beforeEach(async () => {
    closed = 'not closed';
    const dialogRef = {
      close: (value: TelemetryLevel | undefined) => {
        closed = value;
      },
    };

    await TestBed.configureTestingModule({
      imports: [TelemetryConsentDialogComponent],
      providers: [provideNoopAnimations(), {provide: MatDialogRef, useValue: dialogRef}],
    }).compileComponents();

    service = TestBed.inject(TelemetryConsentService);
    fixture = TestBed.createComponent(TelemetryConsentDialogComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    telemetryConsent.set(0);
    localStorage.removeItem(STORAGE_KEY);
  });

  function radios(): HTMLInputElement[] {
    const element = fixture.nativeElement as HTMLElement;
    return Array.from(element.querySelectorAll<HTMLInputElement>('mat-radio-button input[type="radio"]'));
  }

  function button(label: string): HTMLButtonElement {
    const element = fixture.nativeElement as HTMLElement;
    const found = Array.from(element.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) throw new Error(`no button labelled ${label}`);
    return found;
  }

  it('offers one option per level, each with its explanation', () => {
    expect(radios().length).toBe(3);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const option of TELEMETRY_LEVEL_OPTIONS) {
      expect(text).withContext(option.id).toContain(option.label);
      expect(text).withContext(option.id).toContain(option.description);
    }
  });

  it('starts on the level currently in force', () => {
    service.set(2);

    const later = TestBed.createComponent(TelemetryConsentDialogComponent);
    later.detectChanges();

    expect(later.componentInstance.selected()).toBe(2);
  });

  it('closes with the chosen level, which the service then persists', () => {
    radios()[1].click();
    fixture.detectChanges();

    button('Save').click();

    expect(closed).toBe(1);

    // What the shell does with the answer.
    service.set(closed as TelemetryLevel);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    expect(service.level()).toBe(1);
    expect(service.answered()).toBeTrue();
  });

  it('closes with level 0 when that is what was chosen', () => {
    radios()[2].click();
    fixture.detectChanges();
    radios()[0].click();
    fixture.detectChanges();

    button('Save').click();

    expect(closed).toBe(0);
  });

  it('records no answer when the dialog is dismissed', () => {
    radios()[2].click();
    fixture.detectChanges();

    button('Not now').click();

    expect(closed).toBeUndefined();
    // The dialog persists nothing on its own; the caller decides, and for a
    // dismissal it decides nothing, so the level stays where it was.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
