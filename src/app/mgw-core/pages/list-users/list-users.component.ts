import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { User, UsersResponse } from '../../models/users';
import { SelectionModel } from '@angular/cdk/collections';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.css']
})
export class ListUsersComponent implements OnInit {
  dataSource = new MatTableDataSource<User>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'username', 'first_name', 'last_name', 'delete']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.listUsers().pipe(
      map((usersResponse: UsersResponse) => {
        const users: User[] = []
        for (const [key, value] of Object.entries(usersResponse)) {
          users.push(value)
        }
        return users
      })
    ).subscribe(
      {
        next: (users: User[]) => {
          console.log(users)
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
}
