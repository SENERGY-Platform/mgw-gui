import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Module } from 'src/app/modules/models/module_models';
import { ConfigTemplate, Deployment, DeploymentTemplate, DeploymentUpdateTemplate, HostResourcesTemplate, InputGroups, ModuleUpdateTemplate, SecretTemplate } from '../../models/deployment_models';
import { FormTemplate, Group } from '../../models/form';

export const NO_GROUP = 'asfsdkfjdjf'

@Component({
    selector: 'deployment-template',
    templateUrl: 'deployment-template.html',
    styleUrls: ['deployment-template.css']
})
export class DeploymentTemplate2 implements OnInit {
    @Input() moduleID: string = ""
    @Input() deploymentID: string = ""
    @Input() IsDependency: boolean = false 
    @Input() pending_version!: string

    form: FormGroup = new FormGroup("")
    @Input() deploymentTemplateData?: DeploymentTemplate | DeploymentUpdateTemplate | ModuleUpdateTemplate
    @Input() secretOptions: any = {}
    @Input() hostResourcesOptions: any = {}
    @Input() mode: string = "show"
    @Input() dependencyFormIDToModuleID!: Record<string, string>
    module!: Module
    deployment!: Deployment
    ready: boolean = false
    noGroupKey = NO_GROUP;

    formTemplate: FormTemplate = {};
    groupHierarchy?: Group;

    constructor(
      public dialog: MatDialog, 
      private rootFormGroup: FormGroupDirective,
      @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
      private errorService: ErrorService,
      @Inject('HostManagerService') private hostService: HostManagerService
    ) {
    }

    ngOnInit(): void {
      this.loadForm()
      this.setupFormTemplate()
      this.setupGroups()

      if(this.mode == 'new' || this.mode == 'update') {
        this.loadModuleInfo()
      } else {
        this.loadDeploymentInfo()
      }
    }

    setupGroup(groupID: string) {
      if(this.formTemplate[groupID] == null) {
        this.formTemplate[groupID] = {
          secrets: {},
          configs: {},
          hostResources: {}
        };
      }
    }

    setupFormTemplate() {
      // organize all secrets, configs, host resources per group
      for(const [id, hostResource] of Object.entries(this.deploymentTemplateData?.host_resources || [])) {
        const groupIP = hostResource.group || NO_GROUP;
        this.setupGroup(groupIP);
        this.formTemplate[groupIP].hostResources[id] = hostResource;
      };

      for(const [id, secret] of Object.entries(this.deploymentTemplateData?.secrets || [])) {
        const groupIP = secret.group || NO_GROUP;
        this.setupGroup(groupIP);
        this.formTemplate[groupIP].secrets[id] = secret;
      };

      for(const [id, config] of Object.entries(this.deploymentTemplateData?.configs || [])) {
        const groupIP = config.group || NO_GROUP;
        this.setupGroup(groupIP);
        this.formTemplate[groupIP].configs[id] = config;
      };

      console.log('Form', this.formTemplate)
    }

    getParentOfGroup(groups: InputGroups, groupID: string): string[] {
      const group = groups[groupID];
      if(group == null) {
        return [];
      }

      if(group.group == null) {
        return [groupID];
      }
      const parents = this.getParentOfGroup(groups, group.group);
      return parents.concat([groupID]);
    }

    mergeGroupHierarchy(hierarchy: any, parents: string[]) {
      let tmp = hierarchy;
      parents.forEach(parent => {
        if(tmp[parent] == null) {
          tmp[parent] = {}
        }
        tmp = tmp[parent]
      });
    }

    setupGroups() {
      const groupHierarchy = {}
      const groups = this.deploymentTemplateData?.input_groups || {};

      for (const [id, group] of Object.entries(groups || {})) {
        const parents = this.getParentOfGroup(groups, id);
        this.mergeGroupHierarchy(groupHierarchy, parents);
      }
      this.groupHierarchy = groupHierarchy;
      console.log('Input Group Hierarchy: ', groupHierarchy);
    }

    inputGroupsExists() {
      return Object.keys(this.deploymentTemplateData?.input_groups || {}).length > 0;
    }

    loadModuleInfo() {
      var moduleID = this.moduleID

      // Dependency Module IDs are replaced by UUIDs
      if(this.IsDependency) {
        moduleID = this.dependencyFormIDToModuleID[this.moduleID]
      }
      this.moduleService.loadModule(moduleID).subscribe({
        next: (module) => {
          this.module = module
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(DeploymentTemplate2.name, "submit", err)
          this.ready = true
        } 
      })
    }

    loadDeploymentInfo() {
      this.moduleService.loadDeployment(this.deploymentID, false, false).subscribe({
        next: (deployment) => {
          this.deployment = deployment
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(DeploymentTemplate2.name, "submit", err)
          this.ready = true
        } 
      })
    }


  loadForm() {
    // Child components can access parent form group via directive
    if(!this.IsDependency) {
      // Main Module Deployment
      this.form = this.rootFormGroup.control
    } else {
      // Dependency Module Deployment
      this.form = this.rootFormGroup.control.get('dependencies')!.get(this.moduleID) as FormGroup;
    }
  }

}