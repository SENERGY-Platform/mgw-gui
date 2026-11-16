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

import {HttpErrorResponse} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import type {Mock} from 'vitest';

import {provideTranslocoTesting} from 'src/testing/transloco-testing';
import {AutoUpdateRun, AutoUpdateSettings, AutoUpdateStatus} from 'src/app/core/models/auto-update';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {NotificationService} from 'src/app/core/services/util/notifications.service';
import {AutoUpdateComponent} from './auto-update.component';

const settings: AutoUpdateSettings = {
  enabled: false,
  level: 'patch',
  window_start: '02:00',
  window_end: '05:00',
  time_zone: 'Europe/Berlin',
};

function run(overrides: Partial<AutoUpdateRun> = {}): AutoUpdateRun {
  return {
    start: '2026-11-10T02:00:00Z',
    end: '2026-11-10T02:05:00Z',
    updated: [],
    skipped: [],
    failed: [],
    has_error: false,
    error_msg: '',
    ...overrides,
  };
}

describe('AutoUpdateComponent', () => {
  let fixture: ComponentFixture<AutoUpdateComponent>;
  let component: AutoUpdateComponent;
  let moduleService: {
    getAutoUpdateSettings: Mock;
    getAutoUpdateStatus: Mock;
    updateAutoUpdateSettings: Mock;
    loadModulesReduced: Mock;
  };
  let errorService: {handleError: Mock};
  let notifications: {showSuccess: Mock};

  function create(opts: {settings?: AutoUpdateSettings; lastRun?: AutoUpdateRun | null; notFound?: boolean} = {}) {
    const current = opts.settings ?? settings;
    const status: AutoUpdateStatus = {...current, last_run: opts.lastRun ?? null};
    const notFound = () => throwError(() => new HttpErrorResponse({status: 404}));
    moduleService = {
      getAutoUpdateSettings: vi.fn().mockReturnValue(opts.notFound ? notFound() : of(current)),
      getAutoUpdateStatus: vi.fn().mockReturnValue(opts.notFound ? notFound() : of(status)),
      updateAutoUpdateSettings: vi.fn().mockReturnValue(of('')),
      loadModulesReduced: vi.fn().mockReturnValue(of([{id: 'mod-a', name: 'Module A'}])),
    };
    errorService = {handleError: vi.fn()};
    notifications = {showSuccess: vi.fn()};

    TestBed.configureTestingModule({
      imports: [AutoUpdateComponent, provideTranslocoTesting('modules', 'core')],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {provide: 'ModuleManagerService', useValue: moduleService},
        {provide: ErrorService, useValue: errorService},
        {provide: NotificationService, useValue: notifications},
      ],
    });
    fixture = TestBed.createComponent(AutoUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  describe('settings', () => {
    it('loads the stored settings into the form', () => {
      create({settings: {...settings, enabled: true, level: 'minor', window_start: '22:00', window_end: '04:00'}});

      expect(component.form).toEqual({
        enabled: true,
        level: 'minor',
        windowStart: '22:00',
        windowEnd: '04:00',
        timeZone: 'Europe/Berlin',
      });
    });

    it('keeps a stored time zone the browser does not list', () => {
      create({settings: {...settings, time_zone: 'Mars/Olympus_Mons'}});

      expect(component.timeZones).toContain('Mars/Olympus_Mons');
      expect(component.form.timeZone).toBe('Mars/Olympus_Mons');
    });

    it('sends the edited settings in the backend shape', () => {
      create();
      component.form.enabled = true;
      component.form.level = 'major';
      component.form.windowStart = '23:30';
      component.form.windowEnd = '01:15';
      component.form.timeZone = 'UTC';

      component.save();

      expect(moduleService.updateAutoUpdateSettings).toHaveBeenCalledWith({
        enabled: true,
        level: 'major',
        window_start: '23:30',
        window_end: '01:15',
        time_zone: 'UTC',
      });
      expect(notifications.showSuccess).toHaveBeenCalledOnce();
      expect(component.saveError).toBe('');
    });

    it('shows the message of a rejected save instead of an error toast', () => {
      create();
      moduleService.updateAutoUpdateSettings.mockReturnValue(
        throwError(() => new HttpErrorResponse({status: 400, error: 'window_start and window_end must differ'})),
      );

      component.save();
      fixture.detectChanges();

      expect(text()).toContain('window_start and window_end must differ');
      expect(errorService.handleError).not.toHaveBeenCalled();
      expect(notifications.showSuccess).not.toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });

    it('reports any other failed save through the error service', () => {
      create();
      moduleService.updateAutoUpdateSettings.mockReturnValue(throwError(() => new HttpErrorResponse({status: 500})));

      component.save();

      expect(errorService.handleError).toHaveBeenCalledOnce();
    });

    it('does not save without a window', () => {
      create();
      component.form.windowStart = '';

      component.save();

      expect(moduleService.updateAutoUpdateSettings).not.toHaveBeenCalled();
    });
  });

  describe('last run', () => {
    it('says so when there was no run yet', () => {
      create({lastRun: null});

      expect(text()).toContain('No run yet');
    });

    it('lists updated, skipped and failed modules', () => {
      create({
        lastRun: run({
          updated: [{id: 'mod-a', from: 'v1.0.0', to: 'v1.0.1'}],
          skipped: [
            {id: 'mod-b', version: 'v1.0.0', next_version: 'v2.0.0', reason: 'level_exceeded', missing: null},
            {id: 'mod-c', version: 'v1.0.0', next_version: 'v1.1.0', reason: 'brand_new_reason', missing: null},
          ],
          failed: [{id: 'mod-d', error: 'pull failed'}],
        }),
      });

      const updated = (fixture.nativeElement as HTMLElement).querySelector('.updated')!.textContent!;
      expect(updated).toContain('Module A');
      expect(updated).toContain('v1.0.0 → v1.0.1');
      const skipped = (fixture.nativeElement as HTMLElement).querySelector('.skipped')!.textContent!;
      expect(skipped).toContain('mod-b');
      expect(skipped).toContain('The version change exceeds the configured level.');
      // an unknown reason is shown as sent
      expect(skipped).toContain('brand_new_reason');
      expect((fixture.nativeElement as HTMLElement).querySelector('.failed')!.textContent).toContain('pull failed');
    });

    it('links a module that needs input to its setup form and names the missing items', () => {
      create({
        lastRun: run({
          skipped: [
            {
              id: 'mod-a',
              version: 'v1.0.0',
              next_version: 'v2.0.0',
              reason: 'needs_input',
              missing: [{kind: 'config', ref: 'token', reason: 'not_set'}],
            },
          ],
        }),
      });

      const link = (fixture.nativeElement as HTMLElement).querySelector('.skipped a.setup-link') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/deployments/edit/mod-a');
      expect(text()).toContain('Config token: no value is set and the module has no default');
    });

    it('offers no setup link for another reason', () => {
      create({
        lastRun: run({
          skipped: [{id: 'mod-a', version: 'v1', next_version: 'v2', reason: 'level_exceeded', missing: null}],
        }),
      });

      expect((fixture.nativeElement as HTMLElement).querySelector('a.setup-link')).toBeNull();
    });

    it('shows the id when the module list has no name for it', () => {
      create({lastRun: run({updated: [{id: 'mod-x', from: 'v1', to: 'v2'}]})});

      expect(component.moduleName('mod-x')).toBe('');
      expect(text()).toContain('mod-x');
    });
  });

  describe('core without auto-update', () => {
    it('shows a neutral state and no error toast on 404', () => {
      create({notFound: true});

      expect(component.available).toBe(false);
      expect(component.ready).toBe(true);
      expect(errorService.handleError).not.toHaveBeenCalled();
      expect(text()).toContain('Not available on this core');
      expect((fixture.nativeElement as HTMLElement).querySelector('mat-slide-toggle')).toBeNull();
    });
  });
});
