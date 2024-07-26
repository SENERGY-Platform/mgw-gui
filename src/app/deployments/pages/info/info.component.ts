import { Component, Inject, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, concatMap, forkJoin, map, Observable, of } from 'rxjs';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Deployment, DeploymentTemplate } from '../../models/deployment_models';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css']
})
export class InfoComponent implements OnInit {
  @Input() deployment!: Deployment
  deploymentID = "" 
  ready: boolean = false
  hostResourceIDToName: Record<string, string> = {}
  secretIDToName: Record<string, string> = {}
  deploymentTemplate: DeploymentTemplate = {host_resources: {}, secrets: {}, configs: {}, input_groups: {}};
  objectKeys = Object.keys

  constructor(
    private route: ActivatedRoute,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    @Inject('SecretManagerService') private secretSercice: SecretManagerServiceService, 
    @Inject('HostManagerService') private hostService: HostManagerService, 
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.deploymentID = params['deploymentID']
      this.loadAllInformation()
    }) 
  }

  loadAllInformation() {
    var obs = [
      this.loadDeployment(),
      this.loadHostResources(),
      this.loadSecrets(),
    ]

    forkJoin(obs).pipe(
      concatMap(_ => this.loadModuleTemplate())
    ).subscribe(_ => {
        this.ready = true
    })
  }

  loadModuleTemplate() {
    return this.moduleService.loadDeploymentTemplate(this.deployment.module.id).pipe(
      map(deploymentTemplate => {
        this.deploymentTemplate = deploymentTemplate;
      }),
      catchError((err, caught) => {
        this.errorService.handleError(InfoComponent.name, "loadModuleTemplate", err)
        return of(null)
      })
    )
  }

  loadDeployment() {
      return this.moduleService.loadDeployment(this.deploymentID, true, true).pipe(
        map(deployment => this.deployment = deployment),
        catchError((err, caught) => {
          this.errorService.handleError(InfoComponent.name, "loadDeployment", err)
          return of(null)
        })
      );
  }

  loadHostResources() {
      return this.hostService.getHostResources().pipe(
        map((hostResources) => {
            if(hostResources) {
              hostResources.forEach(hostResource => {
                this.hostResourceIDToName[hostResource['id']] = hostResource.name
              });
            }
        }),
        catchError((err, caught) => {
          this.errorService.handleError(InfoComponent.name, "loadHostResources", err)
          return of(null)
        })
      );
  }
  
  loadSecrets() {
    return this.secretSercice.getSecrets().pipe(
      map(secrets => {
        if(!!secrets) {
          secrets.forEach(secret => {
            this.secretIDToName[secret.id] = secret.name
          })
        }
      }),
      catchError((err, caught) => {
        this.errorService.handleError(InfoComponent.name, "loadSecrets", err)
        return of(null)
      })
    )
  }

  configurationKeyToName(key: string) {
    // Deployment only provides keys and not human readable names. Must be fetched from the deployment template
    const config = this.deploymentTemplate.configs[key];
    if(config != null) {
      return config.name;
    }
    return '';
  }

  hostResourceKeyToName(key: string) {
    const hostResource = this.deploymentTemplate.host_resources[key];
    if(hostResource != null) {
      return hostResource.name;
    }
    return '';
  }

  secretKeyToName(key: string) {
    const secret = this.deploymentTemplate.secrets[key];
    if(secret != null) {
      return secret.name;
    }
    return '';

  }
 
}
