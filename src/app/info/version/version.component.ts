import { Component, OnInit } from '@angular/core';
import { ContainerEngineManagerService } from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.css']
})
export class VersionComponent implements OnInit {
  uiVersion: string = environment.uiVersion
  ready: boolean = false 
  moduleManagerVersion: string = ""
  secretManagerVersion: string = ""
  hostManagerVersion: string = ""
  containerManagerVersion: string = ""

  constructor(
    private moduleManagerService: ModuleManagerService,
    private secretManagerService: SecretManagerServiceService,
    private hostManagerService: HostManagerService,
    private containerManager: ContainerEngineManagerService
  ) {}

  ngOnInit(): void {
    this.ready = true
    this.moduleManagerService.getVersion().subscribe({
      next: (version) => {
        this.moduleManagerVersion = version
      },
      error: (err) => {
        console.log(err)
      }
    })

    this.secretManagerService.getVersion().subscribe({
      next: (version) => {
        this.secretManagerVersion = version
      },
      error: (err) => {
        console.log(err)
      }
    })

    this.containerManager.getVersion().subscribe({
      next: (version) => {
        this.containerManagerVersion = version
      },
      error: (err) => {
        console.log(err)
      }
    })

    this.hostManagerService.getVersion().subscribe({
      next: (version) => {
        this.hostManagerVersion = version
      },
      error: (err) => {
        console.log(err)
      }
    })
  }
}
