import { Component, OnInit } from '@angular/core';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
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

  constructor(private moduleManagerService: ModuleManagerService) {}

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
  }
}
