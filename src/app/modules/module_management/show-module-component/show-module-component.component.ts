import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModuleManagerServiceService } from '../services/module-manager/module-manager-service.service';

@Component({
  selector: 'app-show-module-component',
  templateUrl: './show-module-component.component.html',
  styleUrls: ['./show-module-component.component.css']
})
export class ShowModuleComponentComponent implements OnInit {
  ready: boolean = false;
  deployment: any 
  deploymentTemplate: any
  mode: string = "show" 

  private routeSub: Subscription = new Subscription();
  constructor(private route: ActivatedRoute, private moduleService: ModuleManagerServiceService) { }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => this.mode = url[0].path)

    this.routeSub = this.route.params.subscribe(params => {
      var deploymentID = params['id']
      this.moduleService.loadDeployment(deploymentID).subscribe(deployment => {
        this.deployment = deployment

        this.moduleService.loadDeploymentTemplate(deployment.module_id).subscribe(deploymentTemplate => {
          (<any>deploymentTemplate)['dependencies'] = {} // TODO only show current values for deployment not dependencies, fix later
          this.deploymentTemplate = deploymentTemplate
        })
        this.ready = true;
      })
    });
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }
}
