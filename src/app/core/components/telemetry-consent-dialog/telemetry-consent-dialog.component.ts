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

import {Component, inject, signal} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {TelemetryLevel} from '../../services/telemetry/telemetry-consent';
import {TelemetryConsentService} from '../../services/telemetry/telemetry-consent.service';

/**
 * Asks how much may be reported, and closes with the answer.
 *
 * Closing without saving closes with undefined, which is not an answer: the
 * level stays at 0 and the question is asked again on the next start. The
 * alternative - recording a dismissal as consent to nothing - reads the same
 * from the outside but silently retires a question nobody read.
 */
@Component({
  selector: 'app-telemetry-consent-dialog',
  templateUrl: './telemetry-consent-dialog.component.html',
  styleUrls: ['./telemetry-consent-dialog.component.css'],
  imports: [MatButton, MatDialogTitle, MatDialogContent, MatDialogActions, MatRadioGroup, MatRadioButton],
})
export class TelemetryConsentDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<TelemetryConsentDialogComponent, TelemetryLevel | undefined>>(MatDialogRef);
  private readonly consent = inject(TelemetryConsentService);

  readonly options = this.consent.options;
  // A copy, so nothing is in force until Save.
  readonly selected = signal<TelemetryLevel>(this.consent.level());

  select(level: TelemetryLevel) {
    this.selected.set(level);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }

  save() {
    this.dialogRef.close(this.selected());
  }
}
