import { DatePipe } from '@angular/common';
import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Deployment } from '../../models/deployment_models';

@Component({
  selector: 'deployment-info',
  templateUrl: './deployment-info.component.html',
  styleUrls: ['./deployment-info.component.css']
})
export class DeploymentInfoComponent implements OnChanges {
  @Input() deployment!: Deployment
  ready: boolean = false

  constructor(
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.deployment = changes['deployment'].currentValue  
  }
}
