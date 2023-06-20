import { Component, Inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { DeploymentTemplate } from '../../models/deployment_models';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {
  deploymentTemplate!: DeploymentTemplate
  ready: boolean = false
  id!: string

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
  ) {}

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => {
      this.id = url[1].path

      this.moduleService.loadDeploymentTemplate(this.id).subscribe((template: any) => {
        this.deploymentTemplate = template
        this.ready = true
      })
    })
  }
}
