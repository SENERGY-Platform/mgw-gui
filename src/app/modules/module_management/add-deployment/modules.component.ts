import { Component, Input } from '@angular/core';
import { ModuleManagerServiceService } from '../services/module-manager/module-manager-service.service';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent {
  deploymentTemplate: any
  ready = false; 

  constructor(private moduleService: ModuleManagerServiceService) {
    this.moduleService.loadDeploymentTemplate("").subscribe((deploymentTemplate: any) => {
      this.deploymentTemplate = deploymentTemplate;
      this.ready = true;
    })
  }
}
