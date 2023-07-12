import { Component, Inject, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Secret } from '../../models/secret_models';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  dataSource = new MatTableDataSource<Secret>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'edit', 'delete']

  constructor(
    @Inject("SecretManagerService") private secretService: SecretManagerServiceService, 
    private errorService: ErrorService,
  ) {
      this.loadSecrets()
      this.init = false
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
