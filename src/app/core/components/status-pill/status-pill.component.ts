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

import {Component, Input} from '@angular/core';

export type StatusTone = 'ok' | 'warn' | 'danger' | 'idle' | 'info';

/**
 * State shown as colour *and* text. The old UI used a bare coloured dot, which
 * carried no meaning for anyone who could not tell the hues apart.
 */
@Component({
  selector: 'mgw-status-pill',
  template: `
    <span [attr.data-tone]="tone" class="pill">
      <span class="dot"></span>
      <span class="text">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px 3px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 550;
        line-height: 18px;
        white-space: nowrap;
      }

      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex: 0 0 auto;
      }

      .pill[data-tone='ok'] {
        background: var(--mgw-ok-container);
        color: var(--mgw-on-ok-container);
      }

      .pill[data-tone='ok'] .dot {
        background: var(--mgw-ok);
      }

      .pill[data-tone='warn'] {
        background: var(--mgw-warn-container);
        color: var(--mgw-on-warn-container);
      }

      .pill[data-tone='warn'] .dot {
        background: var(--mgw-warn);
      }

      .pill[data-tone='danger'] {
        background: var(--mgw-danger-container);
        color: var(--mgw-on-danger-container);
      }

      .pill[data-tone='danger'] .dot {
        background: var(--mgw-danger);
      }

      .pill[data-tone='idle'] {
        background: var(--mgw-idle-container);
        color: var(--mgw-on-idle-container);
      }

      .pill[data-tone='idle'] .dot {
        background: var(--mgw-idle);
      }

      .pill[data-tone='info'] {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }

      .pill[data-tone='info'] .dot {
        background: var(--mat-sys-primary);
      }
    `,
  ],
})
export class StatusPillComponent {
  @Input({required: true}) tone!: StatusTone;
  @Input({required: true}) label!: string;
}
