import { Component, Inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment } from '../../models/deployment_models';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent {
  @Input() deployment!: Deployment
  ready: boolean = false

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
  ) {
    this.route.params.subscribe(params => {
      this.moduleService.loadDeployment(params['id']).subscribe(deployment => {
        this.deployment = deployment
      })
    })
  }

 
}
