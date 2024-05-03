import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sub-deployments',
  templateUrl: './sub-deployments.component.html',
  styleUrls: ['./sub-deployments.component.css']
})
export class SubDeploymentsComponent {
  deploymentID = ''
  
  constructor(
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(params => {
      this.deploymentID = params['id']
    })
  }
}
