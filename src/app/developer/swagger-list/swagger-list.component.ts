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

import {Component, Input, OnInit} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {StatusPillComponent} from '../../core/components/status-pill/status-pill.component';
import {ApiEntry, hasPlayground, isExecutable} from '../api-registry';

@Component({
  selector: 'app-swagger-list',
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    MatIcon,
    MatButton,
    MatTooltip,
    RouterLink,
    StatusPillComponent,
    TranslocoPipe,
  ],
  templateUrl: './swagger-list.component.html',
  styleUrl: './swagger-list.component.css',
  providers: [provideTranslocoScope('developer')],
})
export class SwaggerListComponent implements OnInit {
  @Input() items: ApiEntry[] = [];

  dataSource = new MatTableDataSource<ApiEntry>();
  displayColumns = ['name', 'auth', 'apiUrl', 'actions'];

  hasPlayground = hasPlayground;
  isExecutable = isExecutable;

  ngOnInit(): void {
    this.dataSource.data = this.items;
  }
}
