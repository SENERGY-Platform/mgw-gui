import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DeploymentListComponent} from '../../components/list/deployment-list.component';

@Component({
  selector: 'app-list-deployments',
  templateUrl: './list-deployments.component.html',
  styleUrls: ['./list-deployments.component.css'],
  standalone: true,
  imports: [DeploymentListComponent]
})
export class ListParentDeploymentsComponent {

}
