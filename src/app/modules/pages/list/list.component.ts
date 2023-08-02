import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Module, ModuleUpdates } from '../../models/module_models';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/core/services/util/util.service';
import { UpdateModalComponent } from '../../components/update-modal/update-modal.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<Module>();
  ready: Boolean = false;
  init: Boolean = true;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'version', 'info', 'deploy', 'delete', 'update']
  moduleIDsReadyForUpdate: Record<string, string[]> = {}
  availableModuleUpdates: ModuleUpdates = {} 
  pendingUpdateExists: boolean = false
  interval: any
  
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
      this.getModuleUpdates();
      this.interval = setInterval(() => { 
        this.getModuleUpdates(false); 
      }, 5000);
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  checkForUpdates() {
    this.moduleService.checkForUpdates().subscribe(
      {
        next: (jobID) => {
          var message = "Check for module updates"
          var self = this
          this.utilService.checkJobStatus(jobID, message, function() {
            self.getModuleUpdates()
          })
        }, 
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "checkForUpdates", err)
        }
      }
    )
  }

  getModuleUpdates(showErrorMessage: boolean=true) {
    this.moduleService.getAvailableUpdates().subscribe({
      next: (updates) => {
        // response can be null
        if(!!updates) {
          this.availableModuleUpdates = updates
        
          Object.values(updates).forEach(update => {
            if(update.pending) {
              this.pendingUpdateExists = true
            }
          })
        }
      }, 
      error: (err) => {
        if(showErrorMessage) {
          this.errorService.handleError(ListComponent.name, "getModuleUpdates", err)
        }
      }
    })
  }

  startUpdate(moduleID: string) {
    var moduleUpdate = this.availableModuleUpdates[moduleID]
    if(moduleUpdate.pending) {
      this.router.navigate(['/modules/update/' + encodeURIComponent(moduleID)], {state: {"pending_versions": moduleUpdate.pending_version}})
    } else {
      var dialogRef = this.dialog.open(UpdateModalComponent, {
        data: {
          availableModuleUpdate: moduleUpdate, 
          moduleID: moduleID
        }
      });
    }
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
          this.dataSource.data = modules || []
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
    var path = "/modules/info/" + encodeURIComponent(moduleID)
    this.router.navigateByUrl(path)
  }
}
