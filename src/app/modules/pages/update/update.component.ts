import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  ready: boolean = false
  moduleID!: string 
  pending_versions!: Record<string, string> 

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    private router: Router
  ) {
    var state = this.router.getCurrentNavigation()?.extras.state || {}
    this.pending_versions = state['pending_versions'] || {}
    this.moduleID = this.route.snapshot.paramMap.get("id") || ""
    this.ready = true
  }

  ngOnInit() {
    // Override mode to show/edit depending on URL
 
  }
}
