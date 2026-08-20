import {HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiService} from '../api/api.service';
import {InfoResponse} from '../../models/info';
import {
  DeploymentDeleteJobResult,
  DeploymentJobResult,
  DeploymentUpdateJobResult,
  Job,
  ModulesChangeJobResult,
  RepositoryJobResult,
} from '../../models/jobs';
import {AuxDeployment} from '../../models/aux-deployments';
import {ChangeRequestItem, ModuleReduced, ModulesChangeRequest} from '../../models/modules';
import {RepoModule, RepoModulesFilter, Repository} from '../../models/repositories';
import {GlobalConfig, GlobalConfigInput} from '../../models/global-configs';
import {DeploymentRequestModule, DeploymentUserInput} from '../../models/deployment-request';

@Injectable({
  providedIn: 'root',
})
export class ModuleManagerService {
  moduleManagerPath = '/module-manager';

  constructor(private http: ApiService) {}

  doubleEncode(moduleID: string) {
    return encodeURIComponent(encodeURIComponent(moduleID));
  }

  // Modules

  loadModule(moduleId: string): Observable<any> {
    const url = this.moduleManagerPath + '/modules/' + this.doubleEncode(moduleId);
    return this.http.get(url);
  }

  loadModulesReduced(): Observable<ModuleReduced[]> {
    const url = this.moduleManagerPath + '/modules-reduced';
    return this.http.get(url) as Observable<ModuleReduced[]>;
  }

  // Deployments (next-gen API, addressed by module IDs)

  // the modules that must be configured to deploy the given ones, including dependencies
  loadDeploymentRequest(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    const url = this.moduleManagerPath + '/deployment-request';
    const queryParams = new HttpParams().set('module_ids', moduleIDs.join(','));
    return this.http.get(url, queryParams) as Observable<DeploymentRequestModule[]>;
  }

  loadModuleFull(moduleID: string): Observable<DeploymentRequestModule> {
    const url = this.moduleManagerPath + '/modules/' + this.doubleEncode(moduleID);
    return this.http.get(url) as Observable<DeploymentRequestModule>;
  }

  loadModulesFull(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    const url = this.moduleManagerPath + '/modules';
    const queryParams = new HttpParams().set('ids', moduleIDs.join(','));
    return this.http.get(url, queryParams) as Observable<DeploymentRequestModule[]>;
  }

  // Auxiliary deployments are read-only at the management API; the write
  // operations live under /restricted and belong to the modules themselves
  getAuxDeployments(deploymentID: string): Observable<Record<string, AuxDeployment>> {
    const url = this.moduleManagerPath + '/deployments/' + deploymentID + '/auxiliary/deployments';
    return this.http.get(url) as Observable<Record<string, AuxDeployment>>;
  }

  // job, result via getDeploymentsResult
  createDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    const url = this.moduleManagerPath + '/deployments';
    return this.http.post(url, inputs) as Observable<Job>;
  }

  // job, result via getDeploymentsUpdateResult
  updateDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    const url = this.moduleManagerPath + '/deployments';
    return this.http.put(url, inputs) as Observable<Job>;
  }

  // synchronous: only sets the enabled flag, the runtime monitor starts the
  // containers afterwards; returns the IDs of the enabled deployments
  enableDeployments(moduleIDs: string[]): Observable<string[]> {
    const url = this.moduleManagerPath + '/deployments-enable';
    return this.http.post(url, moduleIDs) as Observable<string[]>;
  }

  // synchronous, see enableDeployments
  disableDeployments(moduleIDs: string[]): Observable<string[]> {
    const url = this.moduleManagerPath + '/deployments-disable';
    return this.http.post(url, moduleIDs) as Observable<string[]>;
  }

  // job, result via getDeploymentsResult
  recreateDeployments(moduleIDs: string[]): Observable<Job> {
    const url = this.moduleManagerPath + '/deployments-recreate';
    return this.http.post(url, moduleIDs) as Observable<Job>;
  }

  // job, result via getDeploymentsDeleteResult
  removeDeployments(moduleIDs: string[]): Observable<Job> {
    const url = this.moduleManagerPath + '/deployments';
    const queryParams = new HttpParams().set('module_ids', moduleIDs.join(','));
    return this.http.delete(url, undefined, queryParams) as Observable<Job>;
  }

  // Repositories

  getRepositories(): Observable<Repository[]> {
    const url = this.moduleManagerPath + '/repositories';
    return this.http.get(url) as Observable<Repository[]>;
  }

  // job, result via getRepositoriesRefreshResult; discards a pending modules change request
  refreshRepositories(sources?: string[]): Observable<Job> {
    const url = this.moduleManagerPath + '/repositories';
    let queryParams = new HttpParams();
    if (sources && sources.length > 0) {
      queryParams = queryParams.set('sources', sources.join(','));
    }
    return this.http.patch(url, undefined, queryParams) as Observable<Job>;
  }

  // the body is passed verbatim to the repository type handler
  // (github.com: {owner, repository, reference, priority, channels})
  createRepository(repositoryType: string, definition: any): Observable<any> {
    const url = this.moduleManagerPath + '/repositories';
    const queryParams = new HttpParams().set('type', repositoryType);
    return this.http.post(url, definition, queryParams, 'text');
  }

  deleteRepository(source: string): Observable<any> {
    const url = this.moduleManagerPath + '/repositories/' + this.doubleEncode(source);
    return this.http.delete(url, undefined, undefined, 'text');
  }

  loadRepositoryModules(filter?: RepoModulesFilter): Observable<RepoModule[]> {
    const url = this.moduleManagerPath + '/repository-modules';
    let queryParams = new HttpParams();
    if (filter?.name) {
      queryParams = queryParams.set('name', filter.name);
    }
    if (filter?.installed) {
      queryParams = queryParams.set('installed', 'true');
    }
    if (filter?.updateAvailable) {
      queryParams = queryParams.set('update_available', 'true');
    }
    if (filter?.repositories && filter.repositories.length > 0) {
      queryParams = queryParams.set('repositories', filter.repositories.join(','));
    }
    return this.http.get(url, queryParams) as Observable<RepoModule[]>;
  }

  getAvailableUpdatesCount(): Observable<number> {
    const url = this.moduleManagerPath + '/modules-available-updates';
    return this.http.get(url) as Observable<number>;
  }

  // Global configs

  getGlobalConfigs(): Observable<Record<string, GlobalConfig>> {
    const url = this.moduleManagerPath + '/global-configs';
    return this.http.get(url) as Observable<Record<string, GlobalConfig>>;
  }

  // returns the ID of the created global config
  createGlobalConfig(input: GlobalConfigInput): Observable<string> {
    const url = this.moduleManagerPath + '/global-configs';
    return this.http.post(url, input, undefined, 'text') as Observable<string>;
  }

  updateGlobalConfig(configID: string, input: GlobalConfigInput): Observable<any> {
    // config IDs are UUIDs generated by the module-manager, no escaping needed
    const url = this.moduleManagerPath + '/global-configs/' + configID;
    return this.http.put(url, input);
  }

  deleteGlobalConfig(configID: string): Observable<any> {
    const url = this.moduleManagerPath + '/global-configs/' + configID;
    return this.http.delete(url, undefined, undefined, 'text');
  }

  // Modules change request (singleton: POST creates or replaces, PATCH
  // executes and clears, DELETE discards; GET returns 404 if none is pending)

  getModulesChangeRequest(): Observable<ModulesChangeRequest> {
    const url = this.moduleManagerPath + '/modules-change-request';
    return this.http.get(url) as Observable<ModulesChangeRequest>;
  }

  createModulesChangeRequest(items: ChangeRequestItem[]): Observable<ModulesChangeRequest> {
    const url = this.moduleManagerPath + '/modules-change-request';
    return this.http.post(url, items) as Observable<ModulesChangeRequest>;
  }

  createUpdateAllChangeRequest(): Observable<ModulesChangeRequest> {
    const url = this.moduleManagerPath + '/modules-change-request';
    const queryParams = new HttpParams().set('update_all', 'true');
    return this.http.post(url, undefined, queryParams) as Observable<ModulesChangeRequest>;
  }

  // job, result via getModulesChangeResult
  executeModulesChangeRequest(): Observable<Job> {
    const url = this.moduleManagerPath + '/modules-change-request';
    return this.http.patch(url) as Observable<Job>;
  }

  discardModulesChangeRequest(): Observable<any> {
    const url = this.moduleManagerPath + '/modules-change-request';
    return this.http.delete(url, undefined, undefined, 'text');
  }

  // Module Update

  // Deployments

  getJobStatus(jobID: string): Observable<Job> {
    const url = this.moduleManagerPath + '/jobs/' + jobID;
    return this.http.get(url) as Observable<Job>;
  }

  // Jobs

  stopJob(jobID: string): Observable<any> {
    const url = this.moduleManagerPath + '/jobs/' + jobID;
    return this.http.patch(url, undefined, undefined, 'text') as Observable<any>;
  }

  stopJobs(jobIDs: string[]): Observable<any> {
    const url = this.moduleManagerPath + '/jobs-cancel';
    return this.http.post(url, jobIDs, undefined, 'text') as Observable<any>;
  }

  getJobs(jobIDs?: string[]): Observable<Job[]> {
    const url = this.moduleManagerPath + '/jobs';
    let queryParams = new HttpParams();
    if (jobIDs && jobIDs.length > 0) {
      queryParams = queryParams.set('ids', jobIDs.join(','));
    }
    return this.http.get(url, queryParams) as Observable<Job[]>;
  }

  // Job results, available once the job has ended (isJobDone)

  getModulesChangeResult(jobID: string): Observable<ModulesChangeJobResult> {
    const url = this.moduleManagerPath + '/results/modules-change/' + jobID;
    return this.http.get(url) as Observable<ModulesChangeJobResult>;
  }

  getDeploymentsResult(jobID: string): Observable<DeploymentJobResult> {
    const url = this.moduleManagerPath + '/results/deployments/' + jobID;
    return this.http.get(url) as Observable<DeploymentJobResult>;
  }

  getDeploymentsUpdateResult(jobID: string): Observable<DeploymentUpdateJobResult> {
    const url = this.moduleManagerPath + '/results/deployments-update/' + jobID;
    return this.http.get(url) as Observable<DeploymentUpdateJobResult>;
  }

  getDeploymentsDeleteResult(jobID: string): Observable<DeploymentDeleteJobResult> {
    const url = this.moduleManagerPath + '/results/deployments-delete/' + jobID;
    return this.http.get(url) as Observable<DeploymentDeleteJobResult>;
  }

  getRepositoriesRefreshResult(jobID: string): Observable<RepositoryJobResult> {
    const url = this.moduleManagerPath + '/results/repositories-refresh/' + jobID;
    return this.http.get(url) as Observable<RepositoryJobResult>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.moduleManagerPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
