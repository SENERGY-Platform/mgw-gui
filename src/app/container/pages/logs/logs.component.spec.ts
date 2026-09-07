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

import {ActivatedRoute, Params} from '@angular/router';
import {of} from 'rxjs';
import {ContainerEngineManagerService} from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {LogsComponent} from './logs.component';

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
