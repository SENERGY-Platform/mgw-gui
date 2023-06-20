import { Component, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { Module } from '../../models/module_models';

@Component({
  selector: 'module-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent {
  module!: Module
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
}
