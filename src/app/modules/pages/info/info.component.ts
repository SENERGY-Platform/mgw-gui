import {Component, Inject} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {DatePipe, KeyValuePipe, NgFor, NgIf} from '@angular/common';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatChip, MatChipListbox} from '@angular/material/chips';
import {AuxDeploymentsListComponent} from 'src/app/deployments/components/aux-deployments-list/aux-deployments-list.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {
  DEPLOYMENT_STATE_HEALTHY,
  DEPLOYMENT_STATE_UNHEALTHY,
  ModuleInfo
} from 'src/app/core/models/modules';

@Component({
    selector: 'module-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.css'],
    imports: [SpinnerComponent, NgIf, MatFormField, MatLabel, MatInput, MatChipListbox, NgFor, MatChip, DatePipe, KeyValuePipe, RouterLink, MatIconButton, MatIcon, MatTooltip, AuxDeploymentsListComponent]
})
export class InfoComponent {
  module!: ModuleInfo
  ready: boolean = false

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
  ) {
    this.route.params.subscribe(params => {
      var module_id = params['id']
      this.moduleService.loadModule(module_id).subscribe(module => {
        this.module = module
        this.ready = true
      })
    })
  }

  deploymentStateLabel(): string {
    if (!this.module.deployment.enabled) {
      return "stopped"
    }
    switch (this.module.deployment.state) {
      case DEPLOYMENT_STATE_HEALTHY:
        return "healthy"
      case DEPLOYMENT_STATE_UNHEALTHY:
        return "unhealthy"
      default:
        return "unknown"
    }
  }
}
