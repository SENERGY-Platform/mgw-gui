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

import {discardPeriodicTasks, fakeAsync, tick} from '@angular/core/testing';
import {ActivatedRoute, Params} from '@angular/router';
import {of} from 'rxjs';
import {ContainerEngineManagerService} from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {LogsComponent} from './logs.component';
import {DEFAULT_LOG_LINES, LOG_LINES_DEBOUNCE_MS, MAX_LOG_LINES} from 'src/app/core/components/log-viewer/log-lines';

// The page is mounted on two routes that carry different parameters, and the
// back arrow is the only thing that tells them apart. The component is built
// directly; nothing here touches the template.
function componentFor(params: Params): LogsComponent {
  const containerService = {
    getContainerLogs: () => of(''),
  } as unknown as ContainerEngineManagerService;
  const route = {params: of(params)} as unknown as ActivatedRoute;
  return new LogsComponent(containerService, {} as ErrorService, route);
}

describe('LogsComponent back target', () => {
  let component: LogsComponent;

  afterEach(() => {
    component?.ngOnDestroy();
  });

  it('returns to the containers tab of the module that owns the container', () => {
    component = componentFor({id: 'github.com/SENERGY-Platform/mgw-mqtt-bridge', containerId: 'c1'});

    expect(component.backTo).toEqual(['/modules', 'detail', 'github.com/SENERGY-Platform/mgw-mqtt-bridge']);
    expect(component.backToQueryParams).toEqual({tab: 'containers'});
  });

  it('returns to the service list when no module owns the container', () => {
    // system/status/container-logs/:containerId - the core services have no
    // module id, and the page they came from has no tabs.
    component = componentFor({containerId: 'c1'});

    expect(component.backTo).toEqual(['/system', 'status']);
    expect(component.backToQueryParams).toEqual({});
  });
});

// SNRGY-4855: a 0 typed on the way from 100 to 500 requested the whole log
// and locked up the page.
describe('LogsComponent line count', () => {
  let component: LogsComponent;
  let getContainerLogs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getContainerLogs = vi.fn(() => of(''));
    const containerService = {getContainerLogs} as unknown as ContainerEngineManagerService;
    const route = {params: of({containerId: 'c1'})} as unknown as ActivatedRoute;
    component = new LogsComponent(containerService, {} as ErrorService, route);
    getContainerLogs.mockClear();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('requests only the value the field settles on', fakeAsync(() => {
    component.maxLinesChanges(0);
    tick(100);
    component.maxLinesChanges(50);
    tick(100);
    component.maxLinesChanges(500);
    tick(LOG_LINES_DEBOUNCE_MS);

    expect(getContainerLogs.mock.calls).toEqual([['c1', 500]]);
    discardPeriodicTasks();
  }));

  it('never requests 0 lines, which the backend reads as the whole log', fakeAsync(() => {
    component.maxLinesChanges(0);
    tick(LOG_LINES_DEBOUNCE_MS);

    expect(getContainerLogs.mock.calls).toEqual([['c1', 1]]);
    expect(component.maxLines).toBe(1);
    discardPeriodicTasks();
  }));

  it('caps the request at the upper bound', fakeAsync(() => {
    component.maxLinesChanges(MAX_LOG_LINES * 10);
    tick(LOG_LINES_DEBOUNCE_MS);

    expect(getContainerLogs.mock.calls).toEqual([['c1', MAX_LOG_LINES]]);
    expect(component.maxLines).toBe(MAX_LOG_LINES);
    discardPeriodicTasks();
  }));

  it('restores the last line count when the field is left empty', fakeAsync(() => {
    component.maxLinesChanges(null);
    tick(LOG_LINES_DEBOUNCE_MS);

    expect(getContainerLogs).not.toHaveBeenCalled();
    expect(component.maxLines).toBe(DEFAULT_LOG_LINES);
    discardPeriodicTasks();
  }));
});
