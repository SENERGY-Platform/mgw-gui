import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment, DeploymentTemplate } from '../../models/deployment_models';

@Component({
  selector: 'app-show-module-component',
  templateUrl: './show-module-component.component.html',
  styleUrls: ['./show-module-component.component.css']
})
export class ShowModuleComponentComponent implements OnInit {
  deploymentID!: string
  mode: string = "show" 
  ready: boolean = false 

  private routeSub: Subscription = new Subscription();
  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => this.mode = url[0].path)

    this.routeSub = this.route.params.subscribe(params => {
      this.deploymentID = params['id']
      this.ready = true
    })
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }
}
