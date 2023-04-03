import { Component, OnInit } from '@angular/core';
import { ModuleManagerServiceService } from 'src/app/core/services/module-manager/module-manager-service.service';

@Component({
  selector: 'module-list',
  templateUrl: './module-list.component.html',
  styleUrls: ['./module-list.component.css']
})
export class ModuleListComponent implements OnInit{
  modules = [{"name": "Module1", "description": "Lorem ipsum", "running": true}, {"name": "Module2", "description": "Lorem ipsum", "running": false}]

  constructor(private moduleService: ModuleManagerServiceService) {}

  ngOnInit(): void {
      this.moduleService.loadModuleStati()
  }
}
