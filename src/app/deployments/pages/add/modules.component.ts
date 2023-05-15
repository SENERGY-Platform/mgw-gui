import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModuleManagerServiceService } from '../../../core/services/module-manager/module-manager-service.service';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {
  id: string = ""
  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => this.id = url[1].path)
  }
}
