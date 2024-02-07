import { Component, Inject, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Deployment } from '../../models/deployment_models';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent {
  @Input() deployment!: Deployment
  deploymentID?: string 
  ready: boolean = false
  hostResourceIDToName: Record<string, string> = {}
  secretIDToName: Record<string, string> = {}
  objectKeys = Object.keys

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    @Inject('SecretManagerService') private secretSercice: SecretManagerServiceService, 
    @Inject('HostManagerService') private hostService: HostManagerService, 
    private errorService: ErrorService
  ) {
    this.route.params.subscribe(params => {
      this.deploymentID = params['id']
      this.loadAllInformation(params['id'])
    })
  }

  loadAllInformation(deploymentID: string) {
    var obs = []
    obs.push(this.loadDeployment(deploymentID))
    obs.push(this.loadHostResources())
    obs.push(this.loadSecrets())
    forkJoin(obs).subscribe(results => {
      if(results.every(v => v === true)) {
        this.ready = true
      }
    })
  }

  loadDeployment(deploymentID: string): Observable<boolean> {
    return new Observable(obs => {
      this.moduleService.loadDeployment(deploymentID, false).subscribe(
        {
          next: (deployment) => {
            this.deployment = deployment
            obs.next(true)
            obs.complete()
          },
          error: (err) => {
            this.errorService.handleError(InfoComponent.name, "loadDeployment", err)
            obs.next(false)
            obs.complete()
          }
        }
      )
    })
  }

  loadHostResources(): Observable<boolean> {
    return new Observable(obs => {
      this.hostService.getHostResources().subscribe(
        {
          next: (hostResources) => {
            if(hostResources) {
              hostResources.forEach(hostResource => {
                this.hostResourceIDToName[hostResource['id']] = hostResource.name
              });
            }
            obs.next(true)
            obs.complete()
          },
          error: (err) => {
            this.errorService.handleError(InfoComponent.name, "loadHostResources", err)
            obs.next(false)
            obs.complete()
          }
        }
      )
    })
  }
  
  loadSecrets(): Observable<boolean> {
    return this.secretSercice.getSecrets().pipe(
      map(secrets => {
        if(!!secrets) {
          secrets.forEach(secret => {
            this.secretIDToName[secret.id] = secret.name
          })
        }
      
        return true
      }),
      catchError((err, caught) => {
        this.errorService.handleError(InfoComponent.name, "loadSecrets", err)
        return of(false)
      })
    )
  }
 
}
