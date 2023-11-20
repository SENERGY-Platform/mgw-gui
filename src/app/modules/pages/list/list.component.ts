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
import { catchError, Observable, of, map, concatMap, throwError, forkJoin } from 'rxjs';

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
      var moduleObs = this.loadModules();
      var updateObs = this.checkForCurrentlyAvailableUpdates();
      forkJoin([moduleObs, updateObs]).subscribe({
        next: (b) => {
          console.log(b)
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "ngOnInit", err)
          this.ready = true
        }
      })

      this.init = false;

      this.interval = setInterval(() => { 
        this.checkForCurrentlyAvailableUpdates().subscribe(); 
      }, 5000);
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  checkForCurrentlyAvailableUpdates(): Observable<boolean> {
    // Only get currently available updates, this does not trigger the backend to check for actual new versions in the repos
    return this.moduleService.getAvailableUpdates().pipe(
      map(updates => {
        if(!!updates) {
          this.availableModuleUpdates = updates
        }
        return true
      })
    )
  }


  checkForUpdates() {
    this.stopPendingUpdates().pipe(
      concatMap(_ => {
        return this.moduleService.checkForUpdates()
      }),
      concatMap(jobID => {
        var message = "Check for module updates"
        return this.utilService.checkJobStatus(jobID, message)
      }),
      concatMap(jobResult => {
        if(!jobResult.success) {
          throwError(() => new Error(jobResult.error))
        }
        return this.moduleService.getAvailableUpdates()
      }),
      concatMap(updates => {
        // response can be null
        if(!!updates) {
          this.availableModuleUpdates = updates
        }
        return of()
      }),
      catchError(err => {
        this.errorService.handleError(ListComponent.name, "checkForUpdates", err)
        this.ready = true 
        return of()
      })
    ).subscribe()
    
  }

  stopPendingUpdates(): Observable<boolean> {
    for (const [moduleID, update] of Object.entries(this.availableModuleUpdates)) {
      if(update.pending) {
        return this.moduleService.cancelModuleUpdate(moduleID).pipe(
          map(result => true),
          catchError((err) => {
            throw err
          })
        )
      }
    }

    return of(true)
  }

  startUpdate(moduleID: string) {
    this.ready = false
    // otherwise an update is not possible
    this.stopPendingUpdates().subscribe({
      next: (_) => {
        this.ready = true
        var moduleUpdate = this.availableModuleUpdates[moduleID]
       
        var dialogRef = this.dialog.open(UpdateModalComponent, {
            data: {
              availableModuleUpdate: moduleUpdate, 
              moduleID: moduleID
            }
        });
    
        dialogRef?.afterClosed().subscribe(_ => {
            this.loadModules()
        })
      },
      error: (err) => {
        this.ready = true
        this.errorService.handleError(ListComponent.name, "stopPendingUpdates", err)
      }
    })


  }

  ngAfterViewInit(): void {
    this.dataSource.sortingDataAccessor = (row: Module, sortHeaderId: string) => {
      var value = (<any>row)[sortHeaderId];
      value = (typeof(value) === 'string') ? value.toUpperCase(): value;
      return value
    };
    this.dataSource.sort = this.sort;
  }

  loadModules(): Observable<boolean> {
    return this.moduleService.loadModules().pipe(
        map((modules) => {
          if(!modules) {
            this.dataSource.data = []
          } else {
            var moduleList: Module[] = []
            for (const [_, module] of Object.entries(modules)) {
              moduleList.push(module)
            }
            this.dataSource.data = moduleList
          }
          return true
        })
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
