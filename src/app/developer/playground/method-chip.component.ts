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

/** HTTP method badge, colour-coded by how much the method changes. */
@Component({
  selector: 'api-method-chip',
  template: `<span [attr.data-method]="method" class="method">{{ method }}</span>`,
  styles: [`
    .method {
      display: inline-block;
      min-width: 52px;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-align: center;
      line-height: 16px;
      background: var(--mgw-idle-container);
      color: var(--mgw-on-idle-container);
    }

    .method[data-method='GET'] {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .method[data-method='POST'] {
      background: var(--mgw-ok-container);
      color: var(--mgw-on-ok-container);
    }

    .method[data-method='PUT'],
    .method[data-method='PATCH'] {
      background: var(--mgw-warn-container);
      color: var(--mgw-on-warn-container);
    }

    .method[data-method='DELETE'] {
      background: var(--mgw-danger-container);
      color: var(--mgw-on-danger-container);
    }
  `]
})
export class MethodChipComponent {
  @Input({required: true}) method!: string;
}
