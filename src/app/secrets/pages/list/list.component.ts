import {Component, Inject, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
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
  MatTableDataSource
} from '@angular/material/table';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Secret, SecretTypesDisplayNames} from '../../models/secret_models';

import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatSortHeader} from '@angular/material/sort';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    imports: [SpinnerComponent, MatTable, MatSort, MatSortHeader, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatIconButton, MatButton, MatTooltip, RouterLink, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, PageHeaderComponent, EmptyStateComponent]
})
export class ListComponent {
  dataSource = new MatTableDataSource<Secret>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  secretTypesDisplayNames: Record<any, string> = SecretTypesDisplayNames; // any type because elements in matCellDef are not typed
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'type', 'actions']

  constructor(
    @Inject("SecretManagerService") private secretService: SecretManagerServiceService,
    private errorService: ErrorService,
  ) {
    this.loadSecrets()
    this.init = false
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadSecrets() {
    this.secretService.getSecrets().subscribe({
      next: (secrets) => {
        this.dataSource.data = secrets
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, "loadSecrets", err)
        this.ready = true
      }
    })
  }

  delete(secretID: string) {
    this.secretService.deleteSecret(secretID).subscribe({
      next: (_) => {
        this.ready = false
        this.loadSecrets()
      },
      error: (err) => {
        this.errorService.handleError(ListComponent.name, "delete", err)
        this.ready = true
      }
    })
  }
}
