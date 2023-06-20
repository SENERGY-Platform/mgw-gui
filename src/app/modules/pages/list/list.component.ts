import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Module } from '../../models/module_models';
import { SelectionModel } from '@angular/cdk/collections';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { HttpUrlEncodingCodec } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  dataSource = new MatTableDataSource<Module>();
  selection = new SelectionModel<Module>(true, []);
  ready: Boolean = false;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'version', 'deploy', 'delete']
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.loadModules();
  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Module, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof(value) === 'string') ? value.toUpperCase(): value;
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadModules() {
    this.moduleService.loadModules().subscribe(
      {
        next: (modules) => {
          this.dataSource.data = modules
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "loadModules", err)
          this.ready = true
        }
      }
    )
  }

  deleteModule(moduleID: string) {
    this.moduleService.deleteModule(moduleID).subscribe(
      {
        next: (_) => {
          this.loadModules()
        }, 
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "deleteModule", err)
          this.ready = true
        }
      }
    )
  }

  deployModule(moduleID: string) {
    var path = "/deployments/add/" + encodeURIComponent(moduleID)
    this.router.navigateByUrl(path)
  }
}
