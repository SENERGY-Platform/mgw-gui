import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  DeploymentComponentComponent
} from '../../../deployments/components/module-deployment/deployment-component.component';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css'],
  standalone: true,
  imports: [DeploymentComponentComponent]
})
export class UpdateComponent {
  moduleID!: string
  pending_versions!: Record<string, string>

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    var state = this.router.getCurrentNavigation()?.extras.state || {}
    this.pending_versions = state['pending_versions'] || {}
    this.moduleID = decodeURIComponent(this.route.snapshot.paramMap.get("id") || "")
  }

}
