import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModuleManagerServiceService } from '../../../core/services/module-manager/module-manager-service.service';

@Component({
  selector: 'app-show-module-component',
  templateUrl: './show-module-component.component.html',
  styleUrls: ['./show-module-component.component.css']
})
export class ShowModuleComponentComponent implements OnInit {
  deploymentID: any
  mode: string = "show" 

  private routeSub: Subscription = new Subscription();
  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => this.mode = url[0].path)

    this.routeSub = this.route.params.subscribe(params => {
      this.deploymentID = params['id']
    })
  
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }
}
