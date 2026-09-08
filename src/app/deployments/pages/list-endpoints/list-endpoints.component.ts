import {Component, OnInit} from '@angular/core';
import {map} from 'rxjs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
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
// what the nested list filters on; the module id only names the group.
interface EndpointGroup {
  ref: string;
  // empty for an endpoint the core did not label, which is then only
  // identifiable by its deployment
  moduleId: string;
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

  constructor(
    private coreService: CoreManagerService,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
    this.loadDeploymentsWithEndpoints();
  }

  loadDeploymentsWithEndpoints() {
    this.coreService
      .getEndpoints()
      .pipe(map((endpointsResponse: CoreEndpointsResponse) => Object.values(endpointsResponse || {})))
      .subscribe({
        next: (endpoints: CoreEndpoint[]) => {
          this.groups = this.group(endpoints || []);
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
  private group(endpoints: CoreEndpoint[]): EndpointGroup[] {
    const groups: EndpointGroup[] = [];
    for (const endpoint of endpoints) {
      let group = groups.find((candidate) => candidate.ref === endpoint.ref);
      if (!group) {
        group = {ref: endpoint.ref, moduleId: ''};
        groups.push(group);
      }
      if (!group.moduleId) {
        group.moduleId = endpoint.labels?.[MOD_ID_LABEL] || '';
      }
    }
    return groups;
  }
}
