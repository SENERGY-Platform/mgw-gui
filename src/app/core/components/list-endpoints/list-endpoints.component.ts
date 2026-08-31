import {Component, Input, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {MatSort, MatSortHeader} from '@angular/material/sort';
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
import {Router, RouterLink} from '@angular/router';
import {concatMap, map, of, throwError} from 'rxjs';
import {CoreManagerService} from '../../services/core-manager/core-manager.service';
import {ErrorService} from '../../services/util/error.service';
import {UtilService} from '../../services/util/util.service';
import {SelectionModel} from '@angular/cdk/collections';
import {CoreEndpoint, CoreEndpointsResponse} from 'src/app/deployments/models/endpoints';
import {SpinnerComponent} from '../spinner/spinner.component';

import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {safeInjectTransloco} from '../../services/language/safe-transloco';

@Component({
  selector: 'list-endpoints',
  templateUrl: './list-endpoints.component.html',
  styleUrls: ['./list-endpoints.component.css'],
  imports: [
    SpinnerComponent,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatIconButton,
    RouterLink,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatCheckbox,
    MatButton,
    MatTooltip,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('core')],
})
export class ListEndpointsComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<CoreEndpoint>();
  dataSourceAlias = new MatTableDataSource<CoreEndpoint>();

  interval: any;
  ready = false;
  init = true;
  // Two tables, each behind its own condition, so each needs its own
  // MatSort - a single @ViewChild would bind whichever renders first and
  // leave the other table unsorted.
  @ViewChild('endpointSort') set endpointSort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  @ViewChild('aliasSort') set aliasSort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSourceAlias.sort = sort;
    }
  }
  displayColumns = ['url', 'add'];
  displayColumnsAlias = ['select', 'url', 'delete'];
  selection = new SelectionModel<string>(true, []);
  location = location;
  @Input() deploymentID?: string;

  // The job-loader modal this feeds (see UtilService.checkJobStatus) takes a
  // plain string, not a template binding a `transloco` pipe could sit on -
  // so, like ErrorService, this resolves the two messages directly.
  private readonly transloco = safeInjectTransloco();

  constructor(
    private coreService: CoreManagerService,
    private utilsService: UtilService,
    private errorService: ErrorService,
    private router: Router,
  ) {}

  private translate(key: string): string {
    return this.transloco?.translate<string>(key) ?? key;
  }

  ngOnInit(): void {
    this.loadEndpoints(false);
    this.startPeriodicRefresh();
    this.init = false;
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh();
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh();
    this.interval = setInterval(() => {
      this.loadEndpoints(true);
    }, 5000);
  }

  stopPeriodicRefresh() {
    clearTimeout(this.interval);
  }

  loadEndpoints(background: boolean): void {
    this.coreService
      .getEndpoints(this.deploymentID)
      .pipe(
        map((endpointsResponse: CoreEndpointsResponse) => {
          const services: CoreEndpoint[] = [];
          for (const [key, value] of Object.entries(endpointsResponse)) {
            services.push(value);
          }
          return services;
        }),
      )
      .subscribe({
        next: (endpoints: CoreEndpoint[]) => {
          const generatedEndpoints: CoreEndpoint[] = [];
          const aliasEndpoints: CoreEndpoint[] = [];

          endpoints.forEach((endpoint) => {
            if (endpoint.type === 2) {
              aliasEndpoints.push(endpoint);
            } else if (endpoint.type === 1) {
              generatedEndpoints.push(endpoint);
            }
          });

          this.dataSource.data = generatedEndpoints;
          this.dataSourceAlias.data = aliasEndpoints;
          this.ready = true;
        },
        error: (err) => {
          if (!background) {
            this.errorService.handleError(ListEndpointsComponent.name, 'loadServices', err);
          }
          this.ready = true;
        },
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSourceAlias.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSourceAlias.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }

  deleteEndpoint(endpointID: string) {
    this.ready = false;
    this.stopPeriodicRefresh();
    this.coreService
      .deleteEndpoint(endpointID)
      .pipe(
        concatMap((jobID: string) => {
          const message = this.translate('core.listEndpoints.deleteEndpointJob');
          return this.utilsService.checkJobStatus(jobID, message, 'core-manager');
        }),
        concatMap((result) => {
          if (!result.success) {
            return throwError(() => new Error(result.error));
          }
          return of(true);
        }),
      )
      .subscribe({
        next: (_) => {
          this.ready = true;
          this.loadEndpoints(true);
          this.startPeriodicRefresh();
        },
        error: (err) => {
          this.errorService.handleError(ListEndpointsComponent.name, 'deleteEndpoint', err);
          this.ready = true;
          this.loadEndpoints(true);
          this.startPeriodicRefresh();
        },
      });
  }

  deleteMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh();
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
    this.coreService
      .deleteEndpoints(ids)
      .pipe(
        concatMap((jobID: string) => {
          const message = this.translate('core.listEndpoints.deleteEndpointsJob');
          return this.utilsService.checkJobStatus(jobID, message, 'core-manager');
        }),
        concatMap((result) => {
          if (!result.success) {
            return throwError(() => new Error(result.error));
          }
          return of(true);
        }),
      )
      .subscribe({
        next: (_) => {
          this.ready = true;
          this.loadEndpoints(true);
          this.startPeriodicRefresh();
        },
        error: (err) => {
          this.errorService.handleError(ListEndpointsComponent.name, 'deleteMultiple', err);
          this.ready = true;
          this.loadEndpoints(true);
          this.startPeriodicRefresh();
        },
      });
  }
}
