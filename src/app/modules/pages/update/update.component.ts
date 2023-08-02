import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
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
    private router: Router,
    private utilsService: UtilService
  ) {
    var state = this.router.getCurrentNavigation()?.extras.state || {}
    this.pending_versions = state['pending_versions'] || {}
    this.moduleID = decodeURIComponent(this.route.snapshot.paramMap.get("id") || "")
  }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.moduleService.getModuleUpdateTemplate(this.moduleID).subscribe(
      {
        next: (template: ModuleUpdateTemplate) => {
          if(
            this.utilsService.objectIsEmpty(template.configs) &&
            this.utilsService.objectIsEmpty(template.secrets) && 
            this.utilsService.objectIsEmpty(template.host_resources)
          ) {
            // Nothing in template -> just update without showing formular
            this.updateModule()
          }
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(UpdateComponent.name, "ngOnInit", err)
          this.router.navigate(['/modules'])
        }
      }
    )
  }

  updateModule() {
    this.moduleService.updateModule(this.moduleID, {
      "configs": null,
      "host_resources": null,
      "secrets": null,
      "module_id": this.moduleID,
      'dependencies': null
    }).subscribe({
      next: (jobID) => {
        var message = "Module update is running"
        var self = this
        this.utilsService.checkJobStatus(jobID, message, function() {
          self.router.navigate(["/modules"])
        })
      },
      error: (err) => {
        this.errorService.handleError(UpdateComponent.name, "updateModule", err)
      }
    }) 
  }
}
