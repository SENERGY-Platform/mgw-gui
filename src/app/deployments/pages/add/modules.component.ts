import { Component, Inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { DeploymentTemplate } from '../../models/deployment_models';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {
  deploymentTemplate!: DeploymentTemplate
  ready: boolean = false
  moduleID!: string

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => {
      this.moduleID = url[1].path

      this.moduleService.loadDeploymentTemplate(this.moduleID).subscribe(
        {
          next: (template: any) => {
            this.deploymentTemplate = template
            this.ready = true
          },
          error: (err) => {
            this.errorService.handleError(ModulesComponent.name, "ngOnInit", err)
            this.ready = true
          }
        }
      )
    })
  }
}
