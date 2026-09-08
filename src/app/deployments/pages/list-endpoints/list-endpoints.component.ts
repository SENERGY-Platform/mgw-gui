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

import {Component, Inject, OnInit, inject} from '@angular/core';
import {catchError, forkJoin, map, of} from 'rxjs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {ModuleReduced} from 'src/app/core/models/modules';
import {CoreEndpoint, CoreEndpointsResponse} from '../../models/endpoints';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';

import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';
import {EmptyStateComponent} from '../../../core/components/empty-state/empty-state.component';
import {ListEndpointsComponent as ListEndpointsComponent_1} from '../../../core/components/list-endpoints/list-endpoints.component';

// The core labels a generated endpoint with the module that declared it.
const MOD_ID_LABEL = 'mod_id';

// The endpoints of one deployment. Grouping stays by ref because that is
// what the nested list filters on; the module only names the group.
interface EndpointGroup {
  ref: string;
  // empty for an endpoint the core did not label, which is then only
  // identifiable by its deployment
  moduleId: string;
  // display name of that module, the id again when the module list does
  // not know it
  name: string;
}

@Component({
  selector: 'app-list',
  templateUrl: './list-endpoints.component.html',
  styleUrls: ['./list-endpoints.component.css'],
  imports: [
    SpinnerComponent,
    MatIcon,
    MatButton,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    ListEndpointsComponent_1,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('deployments')],
})
export class ListEndpointsComponent implements OnInit {
  groups: EndpointGroup[] = [];
  ready = false;

  private readonly coreService = inject(CoreManagerService);
  private readonly errorService = inject(ErrorService);

  // Stays a constructor parameter: the module manager is provided under a
  // string token so the mock environment can swap it, and inject() takes
  // only a real provider token.
  constructor(@Inject('ModuleManagerService') private moduleService: ModuleManagerService) {}

  ngOnInit(): void {
    this.loadDeploymentsWithEndpoints();
  }

  loadDeploymentsWithEndpoints() {
    forkJoin({
      endpoints: this.coreService
        .getEndpoints()
        .pipe(map((response: CoreEndpointsResponse) => Object.values(response || {}))),
      // only the display names: without them the groups fall back to the
      // module id, which is worth showing on its own
      modules: this.moduleService.loadModulesReduced().pipe(catchError(() => of([] as ModuleReduced[]))),
    }).subscribe({
      next: ({endpoints, modules}) => {
        this.groups = this.group(endpoints || [], modules || []);
        this.ready = true;
      },
      error: (err) => {
        this.errorService.handleError(ListEndpointsComponent.name, 'loadDeploymentsWithEndpoints', err);
        this.ready = true;
      },
    });
  }

  // An alias carries no mod_id, so the label is taken from whichever
  // endpoint of the group has one rather than from the first one seen.
  private group(endpoints: CoreEndpoint[], modules: ModuleReduced[]): EndpointGroup[] {
    const names = new Map(modules.map((module) => [module.id, module.name]));
    const groups: EndpointGroup[] = [];
    for (const endpoint of endpoints) {
      let group = groups.find((candidate) => candidate.ref === endpoint.ref);
      if (!group) {
        group = {ref: endpoint.ref, moduleId: '', name: ''};
        groups.push(group);
      }
      if (!group.moduleId) {
        group.moduleId = endpoint.labels?.[MOD_ID_LABEL] || '';
        group.name = group.moduleId ? names.get(group.moduleId) || group.moduleId : '';
      }
    }
    return groups;
  }
}
