import { Component, Inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { DeploymentTemplate } from '../../models/deployment_models';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { NgIf } from '@angular/common';
import { DeploymentComponentComponent } from '../../components/module-deployment/deployment-component.component';

@Component({
    selector: 'modules',
    templateUrl: './modules.component.html',
    styleUrls: ['./modules.component.css'],
    standalone: true,
    imports: [SpinnerComponent, NgIf, DeploymentComponentComponent]
})
export class ModulesComponent implements OnInit {
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
      this.ready = true
    })
  }
}
