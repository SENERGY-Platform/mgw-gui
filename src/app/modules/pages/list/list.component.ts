import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Module, ModuleUpdates } from '../../models/module_models';
import { SelectionModel } from '@angular/cdk/collections';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { HttpUrlEncodingCodec } from '@angular/common/http';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/core/services/util/util.service';
import { UpdateModalComponent } from '../../components/update-modal/update-modal.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  dataSource = new MatTableDataSource<Module>();
  ready: Boolean = false;
  init: Boolean = true;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'version', 'info', 'deploy', 'delete', 'update']
  moduleIDsReadyForUpdate: Record<string, string[]> = {}
  availableModuleUpdates: ModuleUpdates = {} 
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    private router: Router,
    private utilService: UtilService
  ) {

  }

  ngOnInit(): void {
      this.loadModules();
      this.init = false;
  }

  checkForUpdates() {
    this.moduleService.checkForUpdates().subscribe(
      {
        next: (jobID) => {
          var message = "Check for module updates"
          var self = this
          this.utilService.checkJobStatus(jobID, message, function() {
            self.moduleService.getAvailableUpdates().subscribe(
              {
                next: (availableModuleUpdates: ModuleUpdates) => {
                  self.availableModuleUpdates = availableModuleUpdates
                }, 
                error: (err) => {
                  self.errorService.handleError(ListComponent.name, "checkForUpdates", err)
                }
              }
            )
          })
        }, 
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "checkForUpdates", err)
        }
      }
    )
  }

  showAvailableUpdates(moduleID: string) {
    var dialogRef = this.dialog.open(UpdateModalComponent, {data: {availableModuleUpdate: this.availableModuleUpdates[moduleID], moduleID: moduleID}});
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

  showModuleInfo(moduleID: string) {
    var path = "/modules/show/" + encodeURIComponent(moduleID)
    this.router.navigateByUrl(path)
  }
}
