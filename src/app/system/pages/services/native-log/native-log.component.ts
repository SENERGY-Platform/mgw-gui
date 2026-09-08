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

import {Component, Inject, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';

import {UtilService} from '../../../../core/services/util/util.service';
import {ErrorService} from '../../../../core/services/util/error.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CoreManagerService} from '../../../../core/services/core-manager/core-manager.service';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {LogViewerComponent} from 'src/app/core/components/log-viewer/log-viewer.component';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-native-log',
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSlideToggle,
    LogViewerComponent,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  templateUrl: './native-log.component.html',
  styleUrl: './native-log.component.css',
  providers: [provideTranslocoScope('system')],
})
export class NativeLogComponent implements OnDestroy {
  logID!: string;
  ready = false;
  init = true;
  interval: any;
  maxLines: any = 100;
  logs = '';
  autoRefreshEnabled = true;

  constructor(
    @Inject('CoreManagerService') private coreManagerService: CoreManagerService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe((params) => {
      this.logID = params['log_id'];
      this.getLog();
      this.init = false;
      this.startAutoRefresh();
    });
  }

  getLog() {
    this.coreManagerService.getLog(this.logID, this.maxLines).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(NativeLogComponent.name, 'getLog', err);
        this.ready = true;
      },
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.interval);
  }

  startAutoRefresh() {
    this.interval = setInterval(() => {
      this.getLog();
    }, 5000);
  }

  autoRefreshToggleChanged(event: MatSlideToggleChange) {
    if (event.checked) {
      this.startAutoRefresh();
    } else {
      clearTimeout(this.interval);
    }
  }

  maxLinesChanges(newValue: Event) {
    this.maxLines = newValue;
    this.getLog();
  }
}
