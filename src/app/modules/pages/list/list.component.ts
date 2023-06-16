import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModuleManagerServiceService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Module } from '../../models/module_models';
import { SelectionModel } from '@angular/cdk/collections';

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
  displayColumns = ['select', 'name', 'version', 'deploy']
  
  constructor(
    public dialog: MatDialog, 
    private moduleService: ModuleManagerServiceService, 
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
      if (this.isAllSelected()) {
          this.selectionClear();
      } else {
          this.dataSource.connect().value.forEach((row) => this.selection.select(row));
      }
  }

  selectionClear(): void {
      this.selection.clear();
  }

  loadModules() {
    this.moduleService.loadModules().subscribe(modules => {
      this.dataSource.data = modules
      this.ready = true
      console.log(modules)
    })
  }

}
