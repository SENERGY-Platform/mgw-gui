import {Component, ViewChild, OnInit, inject} from '@angular/core';
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
  MatTableDataSource,
} from '@angular/material/table';
import {map} from 'rxjs';
import {UserService} from 'src/app/core/services/user/user.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {DeviceUser, DeviceUsersResponse} from '../../models/users';
import {SelectionModel} from '@angular/cdk/collections';
import {NotificationService} from 'src/app/core/services/util/notifications.service';

import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatSortHeader} from '@angular/material/sort';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {EmptyStateComponent} from 'src/app/core/components/empty-state/empty-state.component';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-list-apps',
  templateUrl: './list-apps.component.html',
  styleUrls: ['./list-apps.component.css'],
  imports: [
    SpinnerComponent,
    MatTable,
    MatSort,
    MatSortHeader,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatButton,
    MatTooltip,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    PageHeaderComponent,
    EmptyStateComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('system')],
})
export class ListAppsComponent implements OnInit {
  // Resolved directly rather than through the `transloco` pipe: `showError`
  // below takes a plain string, with no template binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);

  dataSource = new MatTableDataSource<DeviceUser>();
  ready = false;
  init = true;
  interval: any;
  // Set through a setter rather than in the view hook: the table renders
  // behind a condition, so that hook runs before it exists and @ViewChild
  // stays empty - which leaves the rows in whatever order the API sent.
  @ViewChild(MatSort) set tableSort(sort: MatSort | undefined) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }
  displayColumns = ['username', 'model', 'manufacturer', 'actions'];
  selection = new SelectionModel<string>(true, []);

  constructor(
    private userService: UserService,
    private notifierService: NotificationService,
    private errorService: ErrorService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService
      .listDeviceUsers()
      .pipe(
        map((usersResponse: DeviceUsersResponse) => {
          const users: DeviceUser[] = [];
          for (const [key, value] of Object.entries(usersResponse)) {
            users.push(value);
          }
          return users;
        }),
      )
      .subscribe({
        next: (users: DeviceUser[]) => {
          if (!users) {
            this.dataSource.data = [];
          } else {
            this.dataSource.data = users;
          }
          this.ready = true;
        },
        error: (err) => {
          this.errorService.handleError(ListAppsComponent.name, 'loadUsers', err);
          this.ready = true;
        },
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSource.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }

  deleteUser(userID: string) {
    this.userService.deleteUser(userID).subscribe({
      next: (_) => {
        this.loadUsers();
      },
      error: (err) => {
        this.errorService.handleError(ListAppsComponent.name, 'deleteUser', err);
      },
    });
  }

  openPairing() {
    this.userService.openPairingMode().subscribe({
      next: (_) => {
        this.notifierService.showError(this.transloco.translate<string>('system.listApps.pairingOpened'));
      },
      error: (err) => {
        this.errorService.handleError(ListAppsComponent.name, 'openPairing', err);
      },
    });
  }
}
