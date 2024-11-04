import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { HumanUser, HumanUsersResponse } from '../../models/users';
import { SelectionModel } from '@angular/cdk/collections';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { map } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-list-users',
    templateUrl: './list-users.component.html',
    styleUrls: ['./list-users.component.css'],
    standalone: true,
    imports: [NgIf, SpinnerComponent, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatIconButton, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFabButton, RouterLink]
})
export class ListUsersComponent implements OnInit {
  dataSource = new MatTableDataSource<HumanUser>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'username', 'first_name', 'last_name', 'delete', 'edit']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private userService: UserService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.listHumanUsers().pipe(
      map((usersResponse: HumanUsersResponse) => {
        const users: HumanUser[] = []
        for (const [key, value] of Object.entries(usersResponse)) {
          users.push(value)
        }
        return users
      })
    ).subscribe(
      {
        next: (users: HumanUser[]) => {
          if(!users) {
            this.dataSource.data = []
          } else {
            this.dataSource.data = users
          }
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(ListUsersComponent.name, "loadUsers", err)
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
        this.errorService.handleError(ListUsersComponent.name, "deleteUser", err)
      }
    })
  }

  editUser(user: HumanUser) {
    this.router.navigate(['/core/accounts/users/'+ user.id + "/edit"])
  }
}
