import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HostManagerService} from 'src/app/core/services/host-manager/host-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {
  Deployment,
  DeploymentTemplate,
  DeploymentUpdateTemplate,
  InputGroup,
  ModuleUpdateTemplate
} from '../../models/deployment_models';
import {FormTemplate, Group, Template} from '../../models/form';
import {NO_GROUP} from '../single-deployment/deployment-template';
import {NgIf, NgFor, KeyValuePipe} from '@angular/common';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatFabButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';
import {MatInput} from '@angular/material/input';
import {MatChipGrid, MatChipRow, MatChipRemove, MatChipInput} from '@angular/material/chips';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIf, NgFor, MatFormField, MatLabel, MatSelect, MatOption, MatFabButton, MatTooltip, MatIcon, MatInput, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput, MatCard, KeyValuePipe]
})
export class GroupComponent implements OnInit {
  @Input() group?: InputGroup; // The active group, used to display group name, ...
  @Input() groupID?: string;
  @Input() allGroupTemplates?: FormTemplate; // contains templates for all groups, as group may have child groups
  @Input() groupHierarchy?: Group;
  @Input() moduleID: string = ""
  @Input() hostResourcesOptions: any = {}
  @Input() secretOptions: any = {}
  @Input() deploymentTemplateData?: DeploymentTemplate | DeploymentUpdateTemplate | ModuleUpdateTemplate

  form: FormGroup = new FormGroup("")
  template?: Template;

  constructor(
    private rootFormGroup: FormGroupDirective,
    private errorService: ErrorService,
    @Inject('HostManagerService') private hostService: HostManagerService
  ) {
  }

  ngOnInit(): void {
    this.loadForm()
    if (this.groupID == null) {
      this.template = this.allGroupTemplates?.[NO_GROUP];
    } else {
      this.template = this.allGroupTemplates?.[this.groupID];
    }
  }

  showGroupInfo() {
    // dont show group info for the default group
    return this.groupID !== NO_GROUP;
  }

  add(event: any, formGroup: string, config_id: string): void {
    const value = (event.value || '').trim();
    if (value) {
      this.form?.get(formGroup)?.get(config_id)?.value.push(value);
    }
    this.form?.get(formGroup)?.get(config_id)?.updateValueAndValidity()

    // Clear the input value
    event.chipInput!.clear();
  }

  getNumberOfMapElements(element: any) {
    return Object.keys(element).length;
  }

  remove(option: any, formGroup: string, config_id: string): void {
    const index = this.form?.get(formGroup)?.get(config_id)?.value.indexOf(option);

    if (index >= 0) {
      this.form?.get(formGroup)?.get(config_id)?.value.splice(index, 1);
    }
  }

  reloadHostRes() {
    this.hostService.getHostResources().subscribe(
      {
        next: (hostResources) => {
          this.hostResourcesOptions = hostResources
        },
        error: (err) => {
          this.errorService.handleError(GroupComponent.name, "reloadHostRes", err)
        }
      }
    )
  }

  loadForm() {
    this.form = this.rootFormGroup.control
  }
}
