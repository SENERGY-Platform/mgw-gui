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

import {Component, Inject, inject, OnInit} from '@angular/core';
import {DatePipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {RouterLink} from '@angular/router';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';
import {catchError, forkJoin, of} from 'rxjs';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {
  AUTO_UPDATE_LEVELS,
  AUTO_UPDATE_SKIP_REASONS,
  AutoUpdateLevel,
  AutoUpdateRun,
  AutoUpdateSettings,
} from 'src/app/core/models/auto-update';
import {CARRY_OVER_REASONS, CarryOverMissing, CarryOverNavigationState} from 'src/app/core/models/carry-over';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {NotificationService} from 'src/app/core/services/util/notifications.service';

// What the settings form edits; the time inputs bind HH:MM strings as they are.
interface SettingsForm {
  enabled: boolean;
  level: AutoUpdateLevel;
  windowStart: string;
  windowEnd: string;
  timeZone: string;
}

function browserTimeZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
}

@Component({
  selector: 'mgw-auto-update',
  templateUrl: './auto-update.component.html',
  styleUrls: ['./auto-update.component.css'],
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    MatButton,
    MatFormField,
    MatHint,
    MatLabel,
    MatIcon,
    MatInput,
    MatSelect,
    MatOption,
    MatSlideToggle,
    SpinnerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('modules', 'core')],
})
export class AutoUpdateComponent implements OnInit {
  readonly levels = AUTO_UPDATE_LEVELS;

  ready = false;
  // false on a core that answers 404: the page then says so instead of failing
  available = true;
  saving = false;
  // the backend's message for a rejected save, shown next to the button
  saveError = '';
  form: SettingsForm = {enabled: false, level: 'patch', windowStart: '', windowEnd: '', timeZone: ''};
  lastRun: AutoUpdateRun | null = null;
  timeZones: string[] = [];
  private moduleNames: Record<string, string> = {};

  private readonly transloco = inject(TranslocoService);
  private readonly notifications = inject(NotificationService);
  private readonly errorService = inject(ErrorService);

  // The service is provided under a string token (mock or real, per environment),
  // which inject() does not accept.
  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
  ) {}

  private translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate<string>(key, params);
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.ready = false;
    forkJoin({
      settings: this.moduleService.getAutoUpdateSettings(),
      status: this.moduleService.getAutoUpdateStatus(),
      // names are a convenience: without them the page shows the ids
      modules: this.moduleService.loadModulesReduced().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (result) => {
        this.moduleNames = {};
        for (const module of result.modules || []) {
          this.moduleNames[module.id] = module.name;
        }
        this.applySettings(result.settings);
        this.lastRun = result.status?.last_run ?? null;
        this.ready = true;
      },
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.available = false;
        } else {
          this.errorService.handleError(
            AutoUpdateComponent.name,
            'load',
            err,
            this.translate('modules.autoUpdate.errors.loadFailed'),
          );
        }
        this.ready = true;
      },
    });
  }

  private applySettings(settings: AutoUpdateSettings) {
    this.form = {
      enabled: settings.enabled,
      level: settings.level,
      windowStart: settings.window_start,
      windowEnd: settings.window_end,
      timeZone: settings.time_zone,
    };
    // the stored zone stays selectable even if this browser does not list it
    const zones = browserTimeZones();
    if (!zones.includes('UTC')) {
      zones.push('UTC');
    }
    if (settings.time_zone && !zones.includes(settings.time_zone)) {
      zones.push(settings.time_zone);
    }
    this.timeZones = zones.sort();
  }

  canSave(): boolean {
    return !this.saving && !!this.form.windowStart && !!this.form.windowEnd && !!this.form.timeZone;
  }

  save() {
    if (!this.canSave()) {
      return;
    }
    this.saving = true;
    this.saveError = '';
    this.moduleService
      .updateAutoUpdateSettings({
        enabled: this.form.enabled,
        level: this.form.level,
        window_start: this.form.windowStart,
        window_end: this.form.windowEnd,
        time_zone: this.form.timeZone,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notifications.showSuccess(this.translate('modules.autoUpdate.saved'));
        },
        error: (err) => {
          this.saving = false;
          if (err instanceof HttpErrorResponse && err.status === 400) {
            // the backend names the offending field; its text is the message
            this.saveError = typeof err.error === 'string' && err.error ? err.error : err.message;
            return;
          }
          this.errorService.handleError(
            AutoUpdateComponent.name,
            'save',
            err,
            this.translate('modules.autoUpdate.errors.saveFailed'),
          );
        },
      });
  }

  moduleName(id: string): string {
    return this.moduleNames[id] || '';
  }

  // An unknown reason is shown as the backend sent it.
  skipReasonText(reason: string): string {
    return (AUTO_UPDATE_SKIP_REASONS as readonly string[]).includes(reason)
      ? this.translate(`modules.autoUpdate.reasons.${reason}`)
      : reason;
  }

  missingText(item: CarryOverMissing): string {
    const known = (CARRY_OVER_REASONS as readonly string[]).includes(item.reason);
    const kinds = ['config', 'secret', 'host_resource', 'file', 'file_group'];
    const kind = kinds.includes(item.kind) ? this.translate(`core.carryOver.kinds.${item.kind}`) : item.kind;
    const reason = known ? this.translate(`core.carryOver.reasons.${item.reason}`) : item.reason;
    return `${kind} ${item.ref}: ${reason}`;
  }

  // lets the edit form mark the inputs the run could not answer
  formState(id: string, missing: CarryOverMissing[] | null): CarryOverNavigationState {
    return {carryOverMissing: missing?.length ? {[id]: missing} : {}};
  }

  editUrl(id: string): string[] {
    return ['/deployments/edit', id];
  }
}
