import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { Observable, map, forkJoin, catchError, of } from 'rxjs';
import { InfoResponse } from 'src/app/core/models/info';
import { ApiService } from 'src/app/core/services/api/api.service';
import { ContainerEngineManagerService } from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import { CoreManagerService } from 'src/app/core/services/core-manager/core-manager.service';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { environment } from 'src/environments/environment';
import { ComponentInfo } from '../../models/info';
import { NgIf, DecimalPipe } from '@angular/common';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';

@Pipe({
    name: 'duration',
    standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(nanoseconds: number): string {
    let level = "Minutes"
    let duration = nanoseconds/60000000000;

    if(duration > 60) {
      duration = duration/60;
      level = "Hours"
      
      if(duration > 24) {
        duration = duration/24;
        level = "Days"
        
        if(duration > 30) {
          duration = duration/30;
          level = "Months"
        }
      }
    }

    return Math.round(duration).toString() + " " + level;
  }
}

@Component({
    selector: 'app-version',
    templateUrl: './version.component.html',
    styleUrls: ['./version.component.css'],
    standalone: true,
    imports: [NgIf, SpinnerComponent, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DecimalPipe, DurationPipe]
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
    private coreManager: CoreManagerService,
    private userService: UserService,
    private httpClient: HttpClient,
    private errorHandler: ErrorService
  ) {}

  formatMemory(bytes: number) {
    return bytes/1000
  }

  getUiVersion() {
    return this.httpClient.get("/core/web-ui/version", {withCredentials: true, responseType: "text"}).pipe(
      map((version) => {
        return {
          version: version,
          name: "core-ui"
        }
      })
    )
  }

  ngOnInit(): void {
    const obs: Observable<any>[] = [
      this.moduleManagerService.getInfo(),
      this.secretManagerService.getInfo(),
      this.containerManager.getInfo(),
      this.hostManagerService.getInfo(),
      this.coreManager.getInfo(),
      this.userService.getInfo(),
      this.getUiVersion()
    ]

    forkJoin(obs).subscribe({
      next: (infos: InfoResponse[]) => {
        infos.forEach(serviceInfo => {
          var serviceInfoTransformed: any = {
            version: serviceInfo.version,
            name: serviceInfo.name
          }
          if(serviceInfo.mem_stats != null) {
            serviceInfoTransformed['memory'] = this.formatMemory(serviceInfo.mem_stats.alloc)
          }
          if(serviceInfo.up_time != null) {
            serviceInfoTransformed['uptime'] = serviceInfo.up_time
          }
          this.dataSource.data.push(serviceInfoTransformed)
        });
        this.dataSource.data = this.dataSource.data;
        this.ready = true;
      },
      error: (err) => {
        this.errorHandler.handleError("VersionComponent", "ngOnInit", err);
        this.ready = true;
      }
    })

  }
}
