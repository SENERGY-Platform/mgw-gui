import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { map } from 'rxjs';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { DeviceUser, DeviceUsersResponse } from '../../models/users';
import { SelectionModel } from '@angular/cdk/collections';
import { NotificationService } from 'src/app/core/services/util/notifications.service';

@Component({
  selector: 'app-list-apps',
  templateUrl: './list-apps.component.html',
  styleUrls: ['./list-apps.component.css']
})
export class ListAppsComponent {
  dataSource = new MatTableDataSource<DeviceUser>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'username', 'model', 'manufacturer', 'delete']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private userService: UserService,
    private notifierService: NotificationService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.listDeviceUsers().pipe(
      map((usersResponse: DeviceUsersResponse) => {
        const users: DeviceUser[] = []
        for (const [key, value] of Object.entries(usersResponse)) {
          users.push(value)
        }
        return users
      })
    ).subscribe(
      {
        next: (users: DeviceUser[]) => {
          if(!users) {
            this.dataSource.data = []
          } else {
            this.dataSource.data = users
          }
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(ListAppsComponent.name, "loadUsers", err)
          this.ready = true
        }
      }
    )
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if(this.isAllSelected()) {
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
        this.loadUsers()
      },
      error: (err) => {
        this.errorService.handleError(ListAppsComponent.name, "deleteUser", err)
      }
    })
  }

  openPairing() {
    this.userService.openPairingMode().subscribe({
      next: (_) => {
        this.notifierService.showError("MGW open for pairing!");
      },
      error: (err) => {
        this.errorService.handleError(ListAppsComponent.name, "openPairing", err);
      }
    })
  }
}
