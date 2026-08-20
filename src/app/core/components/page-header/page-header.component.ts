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
import {MatIconButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';

/**
 * Title block every page starts with. Actions are projected into
 * [pageActions] so each page decides its own primary action instead of the
 * single floating button the old layout had.
 */
@Component({
  selector: 'mgw-page-header',
  imports: [MatIcon, MatIconButton, RouterLink],
  template: `
    <header class="head">
      <div class="lead">
        @if (backTo) {
          <a [routerLink]="backTo" aria-label="Back" class="back" mat-icon-button>
            <mat-icon>arrow_back</mat-icon>
          </a>
        }
        <div class="titles">
          <h1>{{ title }}</h1>
          @if (description) {
            <p>{{ description }}</p>
          }
        </div>
      </div>
      <div class="actions">
        <ng-content select="[pageActions]"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .lead {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      min-width: 0;
    }

    .back {
      margin: -4px 4px 0 -8px;
    }

    .titles {
      min-width: 0;
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 650;
      letter-spacing: -0.01em;
      line-height: 1.25;
      color: var(--mat-sys-on-surface);
    }

    p {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.45;
      max-width: 68ch;
      color: var(--mat-sys-on-surface-variant);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  `]
})
export class PageHeaderComponent {
  @Input({required: true}) title!: string;
  @Input() description?: string;
  /** shows a back arrow linking to this route */
  @Input() backTo?: string;
}
