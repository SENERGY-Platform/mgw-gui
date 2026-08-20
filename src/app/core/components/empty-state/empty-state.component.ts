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
import {MatIcon} from '@angular/material/icon';

/**
 * Shown instead of an empty table. Every list page used to render a bare
 * sentence, which left the user without a next step; the projected action
 * gives them one.
 */
@Component({
  selector: 'mgw-empty-state',
  imports: [MatIcon],
  template: `
    <div class="empty">
      <mat-icon>{{ icon }}</mat-icon>
      <h2>{{ title }}</h2>
      @if (message) {
        <p>{{ message }}</p>
      }
      <ng-content select="[emptyAction]"></ng-content>
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 56px 24px;
      border: 1px dashed var(--mat-sys-outline-variant);
      border-radius: 14px;
      background: var(--mat-sys-surface);
      text-align: center;
    }

    mat-icon {
      font-size: 34px;
      width: 34px;
      height: 34px;
      color: var(--mat-sys-on-surface-variant);
    }

    h2 {
      margin: 4px 0 0;
      font-size: 16px;
      font-weight: 650;
    }

    p {
      margin: 0 0 10px;
      max-width: 56ch;
      font-size: 13px;
      line-height: 1.5;
      color: var(--mat-sys-on-surface-variant);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input({required: true}) title!: string;
  @Input() message?: string;
}
