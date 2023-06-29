import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { DeploymentTemplate } from 'src/app/deployments/components/single-deployment/deployment-template';
import { ModuleUpdateTemplate } from 'src/app/deployments/models/deployment_models';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent implements OnInit {
  moduleUpdateTemplate!: ModuleUpdateTemplate
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

      this.moduleService.getModuleUpdateTemplate(this.moduleID).subscribe(
        {
          next: (template: any) => {
            this.moduleUpdateTemplate = template
            this.ready = true
          },
          error: (err) => {
            this.errorService.handleError(UpdateComponent.name, "ngOnInit", err)
            this.ready = true
          }
        }
      )
    })
  }
}
