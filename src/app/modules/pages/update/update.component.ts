import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleUpdateTemplate } from 'src/app/deployments/models/deployment_models';
import { ModuleUpdateRequest } from '../../models/module_models';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class UpdateComponent  {
  moduleID!: string 
  pending_versions!: Record<string, string> 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    var state = this.router.getCurrentNavigation()?.extras.state || {}
    this.pending_versions = state['pending_versions'] || {}
    this.moduleID = decodeURIComponent(this.route.snapshot.paramMap.get("id") || "")
  }

}
