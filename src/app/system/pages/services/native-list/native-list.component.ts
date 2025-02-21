import {Component, OnInit, ViewChild} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable,
  MatTableDataSource
} from "@angular/material/table";
import {HostManagerService} from "../../../../core/services/host-manager/host-manager.service";
import {
  ContainerEngineManagerService
} from "../../../../core/services/container-engine-manager/container-engine-manager.service";
import {CoreManagerService} from "../../../../core/services/core-manager/core-manager.service";
import {ErrorService} from "../../../../core/services/util/error.service";
import {forkJoin, Observable} from "rxjs";
import {SpinnerComponent} from "../../../../core/components/spinner/spinner.component";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {MatSort} from "@angular/material/sort";
import {Router} from "@angular/router";
import {NgIf} from "@angular/common";
import {Log} from "../../../models/logs";
import {InfoResponse} from "../../../../core/models/info";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";

interface ListItem {
  name: string;
  version: string;
  logId: string;
}

@Component({
  selector: 'app-native-list',
  standalone: true,
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    NgIf,
    SpinnerComponent,
    MatHeaderCellDef,
    MatIcon,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle
  ],
  templateUrl: './native-list.component.html',
  styleUrl: './native-list.component.css'
})
export class NativeListComponent implements OnInit {
  ready: boolean = false
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'version', 'logs']
  dataSource = new MatTableDataSource<ListItem>();

  constructor(
    private hostManagerService: HostManagerService,
    private containerManager: ContainerEngineManagerService,
    private coreManager: CoreManagerService,
    private errorHandler: ErrorService,
    private router: Router,

  ) {
  }

  ngOnInit(): void {
    const obs: Observable<any>[] = [
      this.containerManager.getInfo(),
      this.hostManagerService.getInfo(),
      this.coreManager.getInfo(),
      this.coreManager.getLogs(),
    ]

    forkJoin(obs).subscribe({
      next: (responses: any[]) => {
        let infoResponses: InfoResponse[] = [];
        let logs: Log[] = [];
        responses.forEach(response => {
          if (instanceOfInfoResponse(response)) {
            infoResponses.push(response);
          } else if (instanceOfLog(response)) {
            logs = response;
          }
        });
        console.log(infoResponses);
        console.log(logs);
        let itemMap: Map<string, ListItem> = new Map();
        infoResponses.forEach(response => {
          let item = itemMap.get(response.name);
          if (item === undefined) {
            item = {
              name: response.name,
              version: response.version,
              logId: "",
            }
          } else {
            item.name = response.name;
            item.version = response.version;
          }
          itemMap.set(response.name, item);
        })
        logs.forEach(log => {
          let item = itemMap.get(log.service_name);
          if (item === undefined) {
            item = {
              name: log.service_name,
              version: "n/a",
              logId: log.id,
            }
          } else {
            item.name = log.service_name;
            item.logId = log.id;
          }
          itemMap.set(log.service_name, item);
        })
        console.log(itemMap);
        itemMap.forEach((item) => {
          this.dataSource.data.push(item)
        })
        this.dataSource.data = this.dataSource.data;
        this.ready = true;
      },
      error: (err) => {
        this.errorHandler.handleError("NativeListComponent", "ngOnInit", err);
        this.ready = true;
      }
    })

  }

  showLog(id: string) {
    this.router.navigate(["system/status/native-logs/" + id])
  }
}

function instanceOfLog(object: any): object is Log[] {
  if (Array.isArray(object) && object.length > 0) {
    return 'id' in object[0] && 'service_name' in object[0];
  }
  return false;
}

function instanceOfInfoResponse(object: any): object is InfoResponse {
  return 'name' in object && 'version' in object;
}
