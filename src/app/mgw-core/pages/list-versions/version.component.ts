import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, map, forkJoin, catchError, of } from 'rxjs';
import { InfoResponse } from 'src/app/core/models/info';
import { ContainerEngineManagerService } from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { environment } from 'src/environments/environment';
import { ComponentInfo } from '../../models/info';



@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css']
})
export class VersionComponent implements OnInit {
  uiVersion: string = environment.uiVersion
  ready: boolean = false 
  displayColumns = ["name", "version", "uptime", "memory"]
  dataSource = new MatTableDataSource<ComponentInfo>();
  
  constructor(
    private moduleManagerService: ModuleManagerService,
    private secretManagerService: SecretManagerServiceService,
    private hostManagerService: HostManagerService,
    private containerManager: ContainerEngineManagerService,
    private errorService: ErrorService
  ) {}

  formatTime(nanoseconds: number) {
    return nanoseconds/60000000000
  }

  formatMemory(bytes: number) {
    return bytes/1000
  }

  ngOnInit(): void {
    const obs: Observable<any>[] = []

    obs.push(this.moduleManagerService.getInfo().pipe(
      map((info: InfoResponse) => {
        this.dataSource.data.push({
          version: info.version,
          name: "Module-Manager",
          memory: this.formatMemory(info.mem_stats.alloc),
          uptime: this.formatTime(info.up_time)
        })
        return true;
      }),
      catchError((err) => {
        this.errorService.handleError(VersionComponent.name, "ngOnInit", err);
        return of(true)
      })
      )
    )

    obs.push(this.secretManagerService.getInfo().pipe(
      map((info: InfoResponse) => {
        this.dataSource.data.push({
          version: info.version,
          name: "Secret-Manager",
          memory: this.formatMemory(info.mem_stats.alloc),
          uptime: this.formatTime(info.up_time)
        })
        return true;
      }),
      catchError((err) => {
        this.errorService.handleError(VersionComponent.name, "ngOnInit", err);
        return of(true)
      })
      )
    )

    obs.push(this.containerManager.getInfo().pipe(
      map((info: InfoResponse) => {
        this.dataSource.data.push({
          version: info.version,
          name: "Container-Manager",
          memory: this.formatMemory(info.mem_stats.alloc),
          uptime: this.formatTime(info.up_time)
        })
        return true;
      }),
      catchError((err) => {
        this.errorService.handleError(VersionComponent.name, "ngOnInit", err);
        return of(true)
      })
      )
    )

    obs.push(this.hostManagerService.getInfo().pipe(
      map((info: InfoResponse) => {
        this.dataSource.data.push({
          version: info.version,
          name: "Host-Manager",
          memory: this.formatMemory(info.mem_stats.alloc),
          uptime: this.formatTime(info.up_time)
        })
        return true;
      }),
      catchError((err) => {
        this.errorService.handleError(VersionComponent.name, "ngOnInit", err);
        return of(true)
      })
      )
    )

    this.dataSource.data.push({
      version: this.uiVersion,
      name: "UI"
    })

    forkJoin(obs).subscribe({
      next: (_) => {
        this.dataSource.data = this.dataSource.data;
        this.ready = true;
      },
      error: (err) => {
        this.ready = true;
      }
    })

  }
}
