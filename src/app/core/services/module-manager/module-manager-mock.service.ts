import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ApiService} from '../api/api.service';
import {
  AddModule,
  Module,
  ModuleUpdate,
  ModuleUpdatePrepare,
  ModuleUpdates
} from '../../../modules/models/module_models';
import {Deployment, DeploymentRequest, DeploymentTemplate} from 'src/app/deployments/models/deployment_models';
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
import {RepoModule, Repository} from '../../models/repositories';


const TEMPLATE = {
  "name": "deployment",
  "host_resources": {
    "bluetooth": {
      "name": "Bluetooth Adapter",
      "description": "Select adapter connected to gateway",
      "group": "G1",
      "tags": [
        "HR Tag"
      ],
      "required": false,
      "value": "bluetooth"
    },
    "zigbee": {
      "name": "Zigbee Adapter",
      "description": "Select adapter connected to gateway",
      "group": "G1",
      "tags": [
        "HR Tag"
      ],
      "required": true,
      "value": "Zigbee"
    }
  },
  "secrets": {
    "cert": {
      "name": "Certificate",
      "description": "Required for encryption",
      "group": "G1",
      "tags": [
        "Sec Tag"
      ],
      "required": true,
      "type": "certificate",
      "value": "cert"
    },
    "login": {
      "name": "Login",
      "description": "Login Credentials",
      "group": "G1",
      "tags": [
        "Sec Tag"
      ],
      "required": false,
      "type": "basic-auth",
      "value": "login"
    }
  },
  "configs": {
    "c1": {
      "name": "Port",
      "description": "Some text value.",
      "required": true,
      "group": "G1",
      "default": null,
      "options": null,
      "opt_ext": false,
      "type": "text",
      "type_opt": {
        "max_len": 15,
        "min_len": 3,
        "regex": "^[a-zA-Z0-9-_]+$"
      },
      "data_type": "string",
      "is_list": false,
      "value": "localhost"
    },
    "c2": {
      "name": "Hosts",
      "description": "List of text values.",
      "required": false,
      "group": "G1",
      "default": [
        "test"
      ],
      "options": null,
      "opt_ext": false,
      "type": "text",
      "type_opt": {
        "max_len": 10,
        "regex": "^[a-zA-Z0-9]+$"
      },
      "data_type": "string",
      "is_list": true,
      "value": ["user1", "user2"]
    },
    "c3": {
      "name": "Names",
      "description": "The alphabet with duplicates.",
      "required": true,
      "group": "G2",
      "default": null,
      "options": [
        "a",
        "b",
        "c"
      ],
      "opt_ext": true,
      "type": "text",
      "type_opt": {
        "max_len": 1,
        "regex": "^[a-z]+$"
      },
      "data_type": "string",
      "is_list": true,
      "value": ["user1", "user2"]
    },
    "c4": {
      "name": "Number of instances",
      "description": "Select alternative option.",
      "required": false,
      "group": "G1",
      "default": 0,
      "options": [
        0,
        2,
        3
      ],
      "opt_ext": false,
      "type": "number",
      "type_opt": null,
      "data_type": "int",
      "is_list": false,
      "value": 2
    },
    "c5": {
      "name": "Config 5",
      "description": "Select from range.",
      "required": false,
      "group": "G1",
      "default": null,
      "options": null,
      "opt_ext": false,
      "type": "number",
      "type_opt": {
        "max": 2,
        "min": 1,
        "step": 0.1
      },
      "data_type": "float",
      "is_list": false,
      "value": 0.5
    }
  },
  "input_groups": {
    "G1": {
      "name": "Group 1",
      "description": "G1 Desc ..",
      "group": ""
    },
    "G2": {
      "name": "Group 2",
      "description": "G2 Desc ..",
      "group": "G1"
    },
    "G3": {
      "name": "Group 3",
      "description": "G3 Desc ..",
      "group": "G1"
    },
    "G4": {
      "name": "Group 4",
      "description": "G3 Desc ..",
      "group": "G3"
    }
  },
  "dependencies": {
    "github.com/SENERGY-Platform/mgw-test-module-a": {
      "host_resources": {
        "hr": {
          "name": "HR Input Name",
          "description": "HR Desc....",
          "group": "G1",
          "tags": [
            "HR Tag"
          ],
          "required": false
        }
      },
      "secrets": {
        "sec": {
          "name": "Sec Input Name",
          "description": "Sec Desc....",
          "group": "G1",
          "tags": [
            "Sec Tag"
          ],
          "required": false,
          "type": "certificate",
          "value": "cert"
        }
      },
      "configs": {
        "cfg": {
          "name": "Cfg Input Name",
          "description": "Cfg Desc....",
          "group": "G2",
          "default": ["a"],
          "options": [
            "a",
            "b"
          ],
          "opt_ext": true,
          "type": "text",
          "type_opt": null,
          "data_type": "string",
          "is_list": true,
          "required": false
        }
      },
      "input_groups": {
        "G1": {
          "name": "Group 1",
          "description": "G1 Desc ..",
          "group": ""
        },
        "G2": {
          "name": "Group 2",
          "description": "G2 Desc ..",
          "group": "G1"
        }
      }
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerMockService {
  constructor(
    private http: ApiService,
    private errorService: ErrorService
  ) {
  }

  public deployModule(deploymentRequest: DeploymentRequest): Observable<string> {
    return new Observable(obs => {
      obs.next("id")
    })
  }

  public loadModule(_: Module): Observable<any> {
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
        "has_error": false,
        "error_msg": ""
      }
    })
  }

  public loadDeploymentTemplate(module_id: string): Observable<DeploymentTemplate> {
    return of(TEMPLATE).pipe(delay(1000));
  }

  public loadModules(): Observable<Module[]> {
    var modules = [
      {
        "id": "github.com/SENERGY-Platform/mgw-test-module-a",
        "name": "module 1",
        "description": "bla",
        "version": "v.1.0",
        "author": "Author",
        "deployment_type": "single",
        "license": "license",
        "tags": [],
        "type": "type",
        "indirect": false,
        "added": new Date(),
        "updated": new Date()
      }, {
        "id": "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module",
        "name": "module 2",
        "description": "bla",
        "version": "v.1.0",
        "author": "Author",
        "deployment_type": "single",
        "license": "license",
        "tags": [],
        "type": "type",
        "indirect": false,
        "added": new Date(),
        "updated": new Date()
      }
    ]
    return of(modules).pipe(delay(1000));
  }

  checkForUpdates(): Observable<string> {
    return of("job_ID").pipe(delay(200));
  }

  getAvailableUpdates(): Observable<any> {
    var moduleUpdates: ModuleUpdates =
      {
        "github.com/SENERGY-Platform/mgw-test-module-a": {
          "versions": ["v2.0.15"], "checked": new Date(), "pending": true, "pending_versions": {
            "github.com/SENERGY-Platform/mgw-test-module-a": "v0.2"
          }
        },
        "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": {
          "versions": ["v0.1.12", "v0.1.3", "v0.1.4"], "checked": new Date(), "pending": false, "pending_versions": {
            "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": "v0.2"
          }
        }
      }
    return of(moduleUpdates).pipe(delay(1000));
  }

  getAvailableModuleUpdates(moduleID: string): Observable<ModuleUpdate> {
    var moduleUpdates: ModuleUpdate = {
      "versions": ["v1", "v2"],
      "checked": new Date(),
      "pending": true, // ready to be updated
      "pending_versions": {
        "github.com/SENERGY-Platform/mgw-test-module-a": "v0.2.12",
        "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": "v0.2.1"
      }
    }
    return of(moduleUpdates).pipe(delay(1000));
  }

  prepareModuleUpdate(moduleID: string, payload: ModuleUpdatePrepare): Observable<string> {
    return of("job_ID").pipe(delay(1000));
  }

  getModuleUpdateTemplate(moduleID: string): Observable<DeploymentTemplate> {
    return of(TEMPLATE).pipe(delay(500))
  }

  cancelModuleUpdate(moduleID: string): Observable<string> {
    return of("done").pipe(delay(1000));
  }

  public loadDeployments(withContainerInfo: boolean): Observable<Deployment[]> {
    var deployments = [
      {
        "module": {
          "id": "github.com/SENERGY-Platform/mgw-test-module-a",
          "version": ""
        },
        "name": "Deployment1",
        "enabled": true,
        "id": "id",
        'created': new Date(),
        'updated': new Date(),
        'secrets': {},
        'host_resources': {},
        'configs': {},
        'dep_requiring': [],
        'required_dep': [],
        'state': null,
        'containers': null,
      },
      {
        "id": "id2",
        "module": {
          "id": "github.com/SENERGY-Platform/mgw-test-module-a",
          "version": ""
        },
        'created': new Date(),
        'updated': new Date(),
        "name": "Deployment2",
        "enabled": false,
        'secrets': {},
        'host_resources': {},
        'configs': {},
        'dep_requiring': [],
        'required_dep': [],
        'state': null,
        'containers': null,
      }]
    deployments = deployments.concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments).concat(deployments)
    return of(deployments).pipe(delay(1000));
  }

  public loadDeployment(deploymentID: string, withContainerInfo: boolean): Observable<Deployment> {
    return new Observable((subscriber) => {
      var template = {
        "module": {
          "id": "github.com/SENERGY-Platform/mgw-test-module-a",
          "version": ""
        },
        "name": "Deployment1",
        "enabled": true,
        "id": "id",
        'created': new Date(),
        'updated': new Date(),
        'secrets': {"cert": {"id": "cert", "variants": []}, "login": {"id": "login", "variants": []}},
        'host_resources': {"zigbee": "value", "bluetooth": "b2"},
        'configs': {
          "c1": {"is_slice": false, "value": "value", "data_type": "string"},
          "c2": {"is_slice": true, "value": ["value", "value2"], "data_type": "string"},
          "c3": {"is_slice": true, "value": ["value"], "data_type": "string"},
          "c4": {"is_slice": false, "value": 1, "data_type": "number"},
          "c5": {"is_slice": false, "value": 2, "data_type": "number"},
        },
        'dep_requiring': [],
        'required_dep': [],
        'state': null,
        'containers': null,
      }
      subscriber.next(template)
      subscriber.complete()
    })
  }

  public loadDeploymentUpdateTemplate(module_id: string): Observable<DeploymentTemplate> {
    return new Observable((subscriber) => {
      subscriber.next(TEMPLATE)
      subscriber.complete()
    })
  }

  public startDeployment(deploymentID: string): Observable<Job> {
    return new Observable(obs => {
      obs.next({
        "id": "id",
        "description": "Test",
        "start": new Date().toISOString(),
        "end": new Date().toISOString()
      })
    })
  }

  public startDeployments(deploymentIDs: string): Observable<Job> {
    return new Observable(obs => {
      obs.next({
        "id": "id",
        "description": "Test",
        "start": new Date().toISOString(),
        "end": new Date().toISOString()
      })
    })
  }

  restartDeployment(deploymentID: string): Observable<any> {
    return of({
      "id": "id",
      "completed": new Date(),
      "error": null,
      "created": new Date(),
      "canceled": new Date(),
      "description": "Test",
      "started": new Date()
    })
  }

  restartDeployments(deploymentIDs: string): Observable<any> {
    return of({
      "id": "id",
      "completed": new Date(),
      "error": null,
      "created": new Date(),
      "canceled": new Date(),
      "description": "Test",
      "started": new Date()
    })
  }

  public stopDeployment(deploymentID: string, force: boolean): Observable<Job> {
    return new Observable(obs => {
      obs.next({
        "id": "id",
        "description": "Test",
        "start": new Date().toISOString(),
        "end": new Date().toISOString()
      })
    })
  }

  public stopDeployments(deploymentIDs: string, force: boolean): Observable<Job> {
    return new Observable(obs => {
      obs.next({
        "id": "id",
        "description": "Test",
        "start": new Date().toISOString(),
        "end": new Date().toISOString()
      })
    })
  }

  addModule(module: AddModule): Observable<any> {
    return new Observable(obs => {
      obs.next({"id": "id", "completed": new Date(), "error": ""})
    })
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

  refreshRepositories(sources?: string[]): Observable<Job> {
    return of({
      "id": "job-repo-refresh",
      "description": "refresh repositories",
      "start": new Date().toISOString(),
      "end": new Date().toISOString()
    })
  }

  loadRepositoryModules(name?: string): Observable<RepoModule[]> {
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
    if (name) {
      modules = modules.filter(m => m.name.toLowerCase().includes(name.toLowerCase()))
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
        "has_error": false,
        "error_msg": "",
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

  deleteModule(_: string): Observable<any> {
    return new Observable(obs => {
      obs.next(true)
    })
  }

  stopJob(jobId: string): Observable<any> {
    return new Observable(obs => {
      obs.next(true)
    })
  }

  stopJobs(jobIDs: string[]): Observable<any> {
    return of(true)
  }

  deleteDeployment(deploymentID: string, force: boolean): Observable<any> {
    return new Observable(obs => {
      obs.next(true)
    })
  }

  deleteDeployments(deploymentIDs: string, force: boolean): Observable<any> {
    return new Observable(obs => {
      obs.next(true)
    })
  }
}
