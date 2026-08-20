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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {ApiOperation} from '../models/openapi';
import {MethodChipComponent} from './method-chip.component';

export interface OperationGroup {
  tag: string;
  operations: ApiOperation[];
}

/** Filterable, tag-grouped index of the operations a service publishes. */
@Component({
  selector: 'api-operation-list',
  imports: [FormsModule, MatFormField, MatLabel, MatInput, MethodChipComponent],
  template: `
    <aside class="ops">
      <mat-form-field appearance="outline" class="ops-search" subscriptSizing="dynamic">
        <mat-label>Filter operations</mat-label>
        <input (ngModelChange)="filterChange.emit($event)" [ngModel]="filter" matInput>
      </mat-form-field>

      @for (group of groups; track group.tag) {
        <div class="op-group">
          <h3>{{ group.tag }}</h3>
          @for (operation of group.operations; track operation.method + operation.path) {
            <button (click)="select.emit(operation)"
                    [class.selected]="selected?.path === operation.path && selected?.method === operation.method"
                    class="op" type="button">
              <api-method-chip [method]="operation.method"></api-method-chip>
              <span class="op-text">
                <span class="op-path">{{ operation.path }}</span>
                <span class="op-summary">{{ operation.summary }}</span>
              </span>
            </button>
          }
        </div>
      }

      @if (groups.length === 0) {
        <p class="no-ops">No operation matches the filter.</p>
      }
    </aside>
  `,
  styles: [`
    .ops {
      display: block;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
      background: var(--mat-sys-surface);
      padding: 12px;
      max-height: calc(100vh - 240px);
      overflow-y: auto;
      position: sticky;
      top: 0;
    }

    .ops-search {
      width: 100%;
      margin-bottom: 8px;
    }

    .op-group h3 {
      margin: 12px 0 4px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }

    .op {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
      padding: 7px 8px;
      border: none;
      border-radius: 9px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .op:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .op.selected {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .op-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .op-path {
      font-family: ui-monospace, 'SFMono-Regular', 'Menlo', monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .op-summary {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .op.selected .op-summary {
      color: inherit;
      opacity: 0.8;
    }

    .no-ops {
      margin: 12px 4px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }
  `]
})
export class OperationListComponent {
  @Input() groups: OperationGroup[] = [];
  @Input() selected?: ApiOperation;
  @Input() filter = '';
  @Output() filterChange = new EventEmitter<string>();
  @Output() select = new EventEmitter<ApiOperation>();
}
