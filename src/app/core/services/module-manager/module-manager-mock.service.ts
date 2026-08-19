import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ApiService} from '../api/api.service';
import {ErrorService} from '../util/error.service';
import {delay} from "rxjs/operators";
import {
  DeploymentDeleteJobResult,
  DeploymentJobResult,
  DeploymentUpdateJobResult,
  Job,
  ModulesChangeJobResult,
  RepositoryJobResult
} from '../../models/jobs';
import {ChangeRequestItem, ModuleReduced, ModulesChangeRequest} from '../../models/modules';
import {RepoModule, RepoModulesFilter, Repository} from '../../models/repositories';
import {GlobalConfig, GlobalConfigInput} from '../../models/global-configs';
import {DeploymentRequestModule, DeploymentUserInput} from '../../models/deployment-request';
import {AuxDeployment} from '../../models/aux-deployments';


@Injectable({
  providedIn: 'root'
})
export class ModuleManagerMockService {
  constructor(
    private http: ApiService,
    private errorService: ErrorService
  ) {
  }


  public loadModule(_: string): Observable<any> {
    return of({
      "id": "github.com/SENERGY-Platform/mgw-test-module-a",
      "name": "module 1",
      "description": "bla",
      "version": "v1.1.0",
      "author": "Author",
      "license": "Apache-2.0",
      "tags": ["tag1", "tag2", "tag3"],
      "source": "github.com/SENERGY-Platform/mgw-module-repository",
      "channel": "main",
      "added": new Date().toISOString(),
      "updated": new Date().toISOString(),
      "is_deployed": true,
      "has_error": false,
      "error_msg": "",
      "deployment": {
        "id": "dep-a",
        "module_source": "github.com/SENERGY-Platform/mgw-module-repository",
        "module_channel": "main",
        "module_version": "v1.0.0",
        "enabled": true,
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "state": 1,
        "containers": {
          "web": {"name": "mgw-mock-dep-web", "alias": "web", "image_id": "sha256:abc", "state": "running", "health": ""},
          "worker": {"name": "mgw-mock-dep-worker", "alias": "worker", "image_id": "sha256:def", "state": "stopped", "health": ""}
        },
        "has_error": false,
        "error_msg": ""
      }
    })
  }



















  private mockRequestModule(id: string): DeploymentRequestModule {
    return {
      "id": id,
      "name": "Mock " + (id.split("/").pop() || id),
      "description": "Mock module for the deployment form",
      "version": "v1.0.0",
      "is_deployed": false,
      "has_error": false,
      "error_msg": "",
      "deployment": <any>{},
      "inputs": {
        "configs": {
          "greeting": {"name": "Greeting", "description": "Shown on the start page", "group": "general"},
          "port": {"name": "Port", "description": "1024-65535", "group": "general"},
          "hosts": {"name": "Hosts", "description": "One per line", "group": ""}
        },
        "resources": {"serial": {"name": "Serial Adapter", "description": "", "group": ""}},
        "secrets": {"cert": {"name": "Certificate", "description": "", "group": ""}},
        "files": {"conf": {"name": "Config File", "description": "", "group": ""}},
        "file_groups": {"extra": {"name": "Extra Files", "description": "", "group": ""}},
        "groups": {"general": {"name": "General", "description": "", "group": ""}}
      },
      "configs": {
        "greeting": {"default": "hello", "options": null, "opt_ext": false, "type": "text", "type_opt": {"max_len": 20}, "data_type": "string", "is_slice": false},
        "port": {"default": 8080, "options": null, "opt_ext": false, "type": "number", "type_opt": {"min": 1024, "max": 65535}, "data_type": "int", "is_slice": false},
        "hosts": {"default": null, "options": null, "opt_ext": false, "type": "text", "type_opt": null, "data_type": "string", "is_slice": true}
      },
      "secrets": {"cert": {"type": "certificate"}},
      "files": {"conf": {"type": "generic", "required": false, "default_data": "bW9jaz10cnVl"}}
    }
  }

  loadDeploymentRequest(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    return of(moduleIDs.map(id => this.mockRequestModule(id))).pipe(delay(300))
  }

  loadModuleFull(moduleID: string): Observable<DeploymentRequestModule> {
    var module = this.mockRequestModule(moduleID)
    module.is_deployed = true
    module.deployment = <any>{
      "id": "dep-a",
      "module_version": "v1.0.0",
      "enabled": true,
      "host_resources": {},
      "secrets": {},
      "configs": {"greeting": {"data_type": 1, "is_slice": false, "value": "servus"}},
      "global_configs": {},
      "files": {},
      "file_groups": {},
      "has_error": false,
      "error_msg": ""
    }
    return of(module)
  }

  loadModulesFull(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    return of(moduleIDs.map(id => {
      var module = this.mockRequestModule(id)
      module.is_deployed = true
      module.deployment = <any>{
        "id": "dep-" + (id.split("/").pop() || id),
        "module_version": "v1.0.0",
        "enabled": true,
        "host_resources": {},
        "secrets": {},
        "configs": {"greeting": {"data_type": 1, "is_slice": false, "value": "servus"}},
        "global_configs": {},
        "files": {},
        "file_groups": {},
        "has_error": false,
        "error_msg": ""
      }
      return module
    })).pipe(delay(300))
  }

  getAuxDeployments(deploymentID: string): Observable<Record<string, AuxDeployment>> {
    return of({
      "aux-1": {
        "id": "aux-1",
        "deployment_id": deploymentID,
        "reference": "operator",
        "name": "Mock Operator",
        "image": "ghcr.io/senergy-platform/mock-operator:v1",
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "enabled": true,
        "recreate": true,
        "labels": null,
        "configs": null,
        "volumes": null,
        "container": {"name": "c1", "alias": "operator", "image_id": "sha256:abc", "state": "running", "health": ""}
      }
    })
  }

  createDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    return of({
      "id": "job-deploy",
      "description": "create deployments",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  updateDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    return of({
      "id": "job-deploy-update",
      "description": "update deployments",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  private globalConfigs: Record<string, GlobalConfig> = {
    "gc-1": {"id": "gc-1", "name": "MQTT Broker Host", "data_type": 1, "is_slice": false, "value": "broker.local"},
    "gc-2": {"id": "gc-2", "name": "Retry Limits", "data_type": 2, "is_slice": true, "value": [3, 5, 10]},
    "gc-3": {"id": "gc-3", "name": "Debug Enabled", "data_type": 4, "is_slice": false, "value": false}
  }
  private globalConfigCounter = 3

  getGlobalConfigs(): Observable<Record<string, GlobalConfig>> {
    return of({...this.globalConfigs}).pipe(delay(300))
  }

  createGlobalConfig(input: GlobalConfigInput): Observable<string> {
    this.globalConfigCounter++
    var id = "gc-" + this.globalConfigCounter
    this.globalConfigs[id] = {"id": id, ...input}
    return of(id)
  }

  updateGlobalConfig(configID: string, input: GlobalConfigInput): Observable<any> {
    this.globalConfigs[configID] = {"id": configID, ...input}
    return of(true)
  }

  deleteGlobalConfig(configID: string): Observable<any> {
    delete this.globalConfigs[configID]
    return of(true)
  }

  getRepositories(): Observable<Repository[]> {
    return of([
      {
        "Type": "host-dir",
        "Source": "localhost",
        "Priority": 0,
        "Channels": [{"Name": "default", "Priority": 0}]
      },
      {
        "Type": "github.com",
        "Source": "github.com/SENERGY-Platform/mgw-module-repository",
        "Priority": 1,
        "Channels": [{"Name": "main", "Priority": 1}, {"Name": "beta", "Priority": 0}]
      }
    ])
  }

  createRepository(repositoryType: string, definition: any): Observable<any> {
    return of(true)
  }

  deleteRepository(source: string): Observable<any> {
    return of(true)
  }

  refreshRepositories(sources?: string[]): Observable<Job> {
    return of({
      "id": "job-repo-refresh",
      "description": "refresh repositories",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  loadRepositoryModules(filter?: RepoModulesFilter): Observable<RepoModule[]> {
    var modules: RepoModule[] = [
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-a",
        "name": "Test Module A",
        "description": "Installed module with an available update",
        "version": "v1.2.0",
        "repository_variants": [
          {
            "source": "github.com/SENERGY-Platform/mgw-module-repository",
            "priority": 1,
            "channels": [{"name": "main", "priority": 1, "version": "v1.2.0"}]
          }
        ],
        "is_installed": true,
        "installed_variant": {
          "source": "github.com/SENERGY-Platform/mgw-module-repository",
          "channel": "main",
          "version": "v1.1.0",
          "next_version": "v1.2.0"
        }
      },
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-c",
        "name": "Test Module C",
        "description": "Module offered by two repositories",
        "version": "v2.0.0",
        "repository_variants": [
          {
            "source": "github.com/SENERGY-Platform/mgw-module-repository",
            "priority": 1,
            "channels": [{"name": "main", "priority": 1, "version": "v2.0.0"}]
          },
          {
            "source": "localhost",
            "priority": 0,
            "channels": [{"name": "default", "priority": 0, "version": "v2.1.0-dev"}]
          }
        ],
        "is_installed": false,
        "installed_variant": {"source": "", "channel": "", "version": "", "next_version": ""}
      },
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-d",
        "name": "Test Module D",
        "description": "Not installed module",
        "version": "v0.3.0",
        "repository_variants": [
          {
            "source": "github.com/SENERGY-Platform/mgw-module-repository",
            "priority": 1,
            "channels": [{"name": "main", "priority": 1, "version": "v0.3.0"}]
          }
        ],
        "is_installed": false,
        "installed_variant": {"source": "", "channel": "", "version": "", "next_version": ""}
      }
    ]
    if (filter?.name) {
      modules = modules.filter(m => m.name.toLowerCase().includes(filter.name!.toLowerCase()))
    }
    if (filter?.installed) {
      modules = modules.filter(m => m.is_installed)
    }
    if (filter?.updateAvailable) {
      modules = modules.filter(m => m.is_installed && !!m.installed_variant.next_version)
    }
    if (filter?.repositories && filter.repositories.length > 0) {
      modules = modules.filter(m => (m.repository_variants || []).some(v => filter.repositories!.includes(v.source)))
    }
    return of(modules).pipe(delay(300));
  }

  getAvailableUpdatesCount(): Observable<number> {
    return of(1)
  }

  private pendingChangeRequest: ModulesChangeRequest | null = null

  getModulesChangeRequest(): Observable<ModulesChangeRequest> {
    if (this.pendingChangeRequest) {
      return of(this.pendingChangeRequest)
    }
    return new Observable(obs => {
      obs.error({status: 404, error: "no pending change request"})
    })
  }

  createModulesChangeRequest(items: ChangeRequestItem[]): Observable<ModulesChangeRequest> {
    this.pendingChangeRequest = {
      "install": items.filter(i => !i.remove && !i.update).map(i => ({
        "id": i.id,
        "name": i.id.split("/").pop() || i.id,
        "description": "",
        "source": i.source || "",
        "channel": i.channel || "",
        "version": "v1.0.0"
      })),
      "change": items.filter(i => i.update).map(i => ([
        {"id": i.id, "name": i.id.split("/").pop() || i.id, "description": "", "source": "src", "channel": "main", "version": "v1.1.0"},
        {"id": i.id, "name": i.id.split("/").pop() || i.id, "description": "", "source": "src", "channel": "main", "version": "v1.2.0"}
      ] as any)),
      "remove": items.filter(i => i.remove).map(i => i.id),
      "created": new Date().toISOString()
    }
    return of(this.pendingChangeRequest)
  }

  createUpdateAllChangeRequest(): Observable<ModulesChangeRequest> {
    return this.createModulesChangeRequest([{id: "github.com/SENERGY-Platform/mgw-test-module-a", update: true}])
  }

  executeModulesChangeRequest(): Observable<Job> {
    this.pendingChangeRequest = null
    return of({
      "id": "job-modules-change",
      "description": "execute modules change request",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  discardModulesChangeRequest(): Observable<any> {
    this.pendingChangeRequest = null
    return of(true)
  }

  loadModulesReduced(): Observable<ModuleReduced[]> {
    var modules: ModuleReduced[] = [
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-a",
        "source": "github.com/SENERGY-Platform/mgw-module-repository",
        "channel": "main",
        "version": "v1.1.0",
        "name": "Test Module A",
        "description": "Deployed module with a pending deployment update",
        "tags": ["tag1"],
        "license": "Apache-2.0",
        "author": "Author",
        "is_deployed": true,
        "has_error": false,
        "error_msg": "",
        "deployment": {
          "id": "dep-a",
          "module_source": "github.com/SENERGY-Platform/mgw-module-repository",
          "module_channel": "main",
          "module_version": "v1.0.0",
          "enabled": true,
          "created": new Date().toISOString(),
          "updated": new Date().toISOString(),
          "state": 1,
          "has_error": false,
          "error_msg": ""
        }
      },
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module",
        "source": "localhost",
        "channel": "default",
        "version": "v1.0.0",
        "name": "Test Module B",
        "description": "Deployed but disabled module",
        "tags": [],
        "license": "Apache-2.0",
        "author": "Author",
        "is_deployed": true,
        "has_error": true,
        "error_msg": "container inspect failed: connection refused",
        "deployment": {
          "id": "dep-b",
          "module_source": "localhost",
          "module_channel": "default",
          "module_version": "v1.0.0",
          "enabled": false,
          "created": new Date().toISOString(),
          "updated": new Date().toISOString(),
          "state": 0,
          "has_error": false,
          "error_msg": ""
        }
      },
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-c",
        "source": "github.com/SENERGY-Platform/mgw-module-repository",
        "channel": "main",
        "version": "v2.0.0",
        "name": "Test Module C",
        "description": "Installed module without a deployment",
        "tags": ["tag2"],
        "license": "Apache-2.0",
        "author": "Author",
        "is_deployed": false,
        "has_error": false,
        "error_msg": "",
        "deployment": <any>{}
      }
    ]
    return of(modules).pipe(delay(500));
  }

  enableDeployments(moduleIDs: string[]): Observable<string[]> {
    return of(moduleIDs)
  }

  disableDeployments(moduleIDs: string[]): Observable<string[]> {
    return of(moduleIDs)
  }

  recreateDeployments(moduleIDs: string[]): Observable<Job> {
    return of({
      "id": "job-recreate",
      "description": "recreate deployments",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  removeDeployments(moduleIDs: string[]): Observable<Job> {
    return of({
      "id": "job-delete",
      "description": "delete deployments",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  getJobStatus(jobID: string): Observable<Job> {
    return of({
      "id": jobID,
      "description": "Mock job",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  getJobs(jobIDs?: string[]): Observable<Job[]> {
    var jobs: Job[] = [
      {
        "id": "job-1",
        "description": "Completed mock job",
        "start": new Date().toISOString(),
        "end": new Date().toISOString()
      },
      {
        "id": "job-2",
        "description": "Running mock job",
        "start": new Date().toISOString(),
        "end": "0001-01-01T00:00:00Z"
      }
    ]
    return of(jobs).pipe(delay(1000));
  }

  getModulesChangeResult(jobID: string): Observable<ModulesChangeJobResult> {
    return of({"job_id": jobID, "has_error": false, "error_msg": "", "success": [], "failed": []})
  }

  getDeploymentsResult(jobID: string): Observable<DeploymentJobResult> {
    return of({"job_id": jobID, "has_error": false, "error_msg": "", "results": [], "results_err_num": 0})
  }

  getDeploymentsUpdateResult(jobID: string): Observable<DeploymentUpdateJobResult> {
    return of({"job_id": jobID, "has_error": false, "error_msg": "", "results": [], "results_err_num": 0})
  }

  getDeploymentsDeleteResult(jobID: string): Observable<DeploymentDeleteJobResult> {
    return of({"job_id": jobID, "has_error": false, "error_msg": "", "results": [], "results_err_num": 0})
  }

  getRepositoriesRefreshResult(jobID: string): Observable<RepositoryJobResult> {
    return of({"job_id": jobID, "has_error": false, "error_msg": "", "Results": [], "results_err_num": 0})
  }


  stopJob(jobId: string): Observable<any> {
    return new Observable(obs => {
      obs.next(true)
    })
  }

  stopJobs(jobIDs: string[]): Observable<any> {
    return of(true)
  }


}
