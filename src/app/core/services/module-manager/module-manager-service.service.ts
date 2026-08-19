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
  RepositoryJobResult
} from '../../models/jobs';
import {AuxDeployment} from '../../models/aux-deployments';
import {ChangeRequestItem, ModuleReduced, ModulesChangeRequest} from '../../models/modules';
import {RepoModule, RepoModulesFilter, Repository} from '../../models/repositories';
import {GlobalConfig, GlobalConfigInput} from '../../models/global-configs';
import {DeploymentRequestModule, DeploymentUserInput} from '../../models/deployment-request';

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerService {
  moduleManagerPath = "/module-manager"

  constructor(
    private http: ApiService,
  ) {
  }

  doubleEncode(moduleID: string) {
    return encodeURIComponent(encodeURIComponent(moduleID))
  }

  // Modules




  loadModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId)
    return this.http.get(url)
  }

  loadModulesReduced(): Observable<ModuleReduced[]> {
    var url = this.moduleManagerPath + "/modules-reduced"
    return <Observable<ModuleReduced[]>>this.http.get(url)
  }

  // Deployments (next-gen API, addressed by module IDs)

  // the modules that must be configured to deploy the given ones, including dependencies
  loadDeploymentRequest(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    var url = this.moduleManagerPath + "/deployment-request"
    let queryParams = new HttpParams().set("module_ids", moduleIDs.join(","))
    return <Observable<DeploymentRequestModule[]>>this.http.get(url, queryParams)
  }

  loadModuleFull(moduleID: string): Observable<DeploymentRequestModule> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleID)
    return <Observable<DeploymentRequestModule>>this.http.get(url)
  }

  loadModulesFull(moduleIDs: string[]): Observable<DeploymentRequestModule[]> {
    var url = this.moduleManagerPath + "/modules"
    let queryParams = new HttpParams().set("ids", moduleIDs.join(","))
    return <Observable<DeploymentRequestModule[]>>this.http.get(url, queryParams)
  }

  // Auxiliary deployments are read-only at the management API; the write
  // operations live under /restricted and belong to the modules themselves
  getAuxDeployments(deploymentID: string): Observable<Record<string, AuxDeployment>> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + "/auxiliary/deployments"
    return <Observable<Record<string, AuxDeployment>>>this.http.get(url)
  }

  // job, result via getDeploymentsResult
  createDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    var url = this.moduleManagerPath + "/deployments"
    return <Observable<Job>>this.http.post(url, inputs)
  }

  // job, result via getDeploymentsUpdateResult
  updateDeployments(inputs: DeploymentUserInput[]): Observable<Job> {
    var url = this.moduleManagerPath + "/deployments"
    return <Observable<Job>>this.http.put(url, inputs)
  }

  // synchronous: only sets the enabled flag, the runtime monitor starts the
  // containers afterwards; returns the IDs of the enabled deployments
  enableDeployments(moduleIDs: string[]): Observable<string[]> {
    var url = this.moduleManagerPath + "/deployments-enable"
    return <Observable<string[]>>this.http.post(url, moduleIDs)
  }

  // synchronous, see enableDeployments
  disableDeployments(moduleIDs: string[]): Observable<string[]> {
    var url = this.moduleManagerPath + "/deployments-disable"
    return <Observable<string[]>>this.http.post(url, moduleIDs)
  }

  // job, result via getDeploymentsResult
  recreateDeployments(moduleIDs: string[]): Observable<Job> {
    var url = this.moduleManagerPath + "/deployments-recreate"
    return <Observable<Job>>this.http.post(url, moduleIDs)
  }

  // job, result via getDeploymentsDeleteResult
  removeDeployments(moduleIDs: string[]): Observable<Job> {
    var url = this.moduleManagerPath + "/deployments"
    let queryParams = new HttpParams().set("module_ids", moduleIDs.join(","))
    return <Observable<Job>>this.http.delete(url, undefined, queryParams)
  }

  // Repositories

  getRepositories(): Observable<Repository[]> {
    var url = this.moduleManagerPath + "/repositories"
    return <Observable<Repository[]>>this.http.get(url)
  }

  // job, result via getRepositoriesRefreshResult; discards a pending modules change request
  refreshRepositories(sources?: string[]): Observable<Job> {
    var url = this.moduleManagerPath + "/repositories"
    let queryParams = new HttpParams()
    if (sources && sources.length > 0) {
      queryParams = queryParams.set("sources", sources.join(","))
    }
    return <Observable<Job>>this.http.patch(url, undefined, queryParams)
  }

  // the body is passed verbatim to the repository type handler
  // (github.com: {owner, repository, reference, priority, channels})
  createRepository(repositoryType: string, definition: any): Observable<any> {
    var url = this.moduleManagerPath + "/repositories"
    let queryParams = new HttpParams().set("type", repositoryType)
    return this.http.post(url, definition, queryParams, 'text')
  }

  deleteRepository(source: string): Observable<any> {
    var url = this.moduleManagerPath + "/repositories/" + this.doubleEncode(source)
    return this.http.delete(url, undefined, undefined, 'text')
  }

  loadRepositoryModules(filter?: RepoModulesFilter): Observable<RepoModule[]> {
    var url = this.moduleManagerPath + "/repository-modules"
    let queryParams = new HttpParams()
    if (filter?.name) {
      queryParams = queryParams.set("name", filter.name)
    }
    if (filter?.installed) {
      queryParams = queryParams.set("installed", "true")
    }
    if (filter?.updateAvailable) {
      queryParams = queryParams.set("update_available", "true")
    }
    if (filter?.repositories && filter.repositories.length > 0) {
      queryParams = queryParams.set("repositories", filter.repositories.join(","))
    }
    return <Observable<RepoModule[]>>this.http.get(url, queryParams)
  }

  getAvailableUpdatesCount(): Observable<number> {
    var url = this.moduleManagerPath + "/modules-available-updates"
    return <Observable<number>>this.http.get(url)
  }

  // Global configs

  getGlobalConfigs(): Observable<Record<string, GlobalConfig>> {
    var url = this.moduleManagerPath + "/global-configs"
    return <Observable<Record<string, GlobalConfig>>>this.http.get(url)
  }

  // returns the ID of the created global config
  createGlobalConfig(input: GlobalConfigInput): Observable<string> {
    var url = this.moduleManagerPath + "/global-configs"
    return <Observable<string>>this.http.post(url, input, undefined, 'text')
  }

  updateGlobalConfig(configID: string, input: GlobalConfigInput): Observable<any> {
    // config IDs are UUIDs generated by the module-manager, no escaping needed
    var url = this.moduleManagerPath + "/global-configs/" + configID
    return this.http.put(url, input)
  }

  deleteGlobalConfig(configID: string): Observable<any> {
    var url = this.moduleManagerPath + "/global-configs/" + configID
    return this.http.delete(url, undefined, undefined, 'text')
  }

  // Modules change request (singleton: POST creates or replaces, PATCH
  // executes and clears, DELETE discards; GET returns 404 if none is pending)

  getModulesChangeRequest(): Observable<ModulesChangeRequest> {
    var url = this.moduleManagerPath + "/modules-change-request"
    return <Observable<ModulesChangeRequest>>this.http.get(url)
  }

  createModulesChangeRequest(items: ChangeRequestItem[]): Observable<ModulesChangeRequest> {
    var url = this.moduleManagerPath + "/modules-change-request"
    return <Observable<ModulesChangeRequest>>this.http.post(url, items)
  }

  createUpdateAllChangeRequest(): Observable<ModulesChangeRequest> {
    var url = this.moduleManagerPath + "/modules-change-request"
    let queryParams = new HttpParams().set("update_all", "true")
    return <Observable<ModulesChangeRequest>>this.http.post(url, undefined, queryParams)
  }

  // job, result via getModulesChangeResult
  executeModulesChangeRequest(): Observable<Job> {
    var url = this.moduleManagerPath + "/modules-change-request"
    return <Observable<Job>>this.http.patch(url)
  }

  discardModulesChangeRequest(): Observable<any> {
    var url = this.moduleManagerPath + "/modules-change-request"
    return this.http.delete(url, undefined, undefined, 'text')
  }

  // Module Update







  // Deployments













  getJobStatus(jobID: string): Observable<Job> {
    var url = this.moduleManagerPath + "/jobs/" + jobID
    return <Observable<Job>>this.http.get(url)
  }

  // Jobs

  stopJob(jobID: string): Observable<any> {
    var url = this.moduleManagerPath + "/jobs/" + jobID
    return <Observable<any>>this.http.patch(url, undefined, undefined, 'text')
  }

  stopJobs(jobIDs: string[]): Observable<any> {
    var url = this.moduleManagerPath + "/jobs-cancel"
    return <Observable<any>>this.http.post(url, jobIDs, undefined, 'text')
  }

  getJobs(jobIDs?: string[]): Observable<Job[]> {
    var url = this.moduleManagerPath + "/jobs"
    let queryParams = new HttpParams()
    if (jobIDs && jobIDs.length > 0) {
      queryParams = queryParams.set("ids", jobIDs.join(","))
    }
    return <Observable<Job[]>>this.http.get(url, queryParams)
  }

  // Job results, available once the job has ended (isJobDone)

  getModulesChangeResult(jobID: string): Observable<ModulesChangeJobResult> {
    var url = this.moduleManagerPath + "/results/modules-change/" + jobID
    return <Observable<ModulesChangeJobResult>>this.http.get(url)
  }

  getDeploymentsResult(jobID: string): Observable<DeploymentJobResult> {
    var url = this.moduleManagerPath + "/results/deployments/" + jobID
    return <Observable<DeploymentJobResult>>this.http.get(url)
  }

  getDeploymentsUpdateResult(jobID: string): Observable<DeploymentUpdateJobResult> {
    var url = this.moduleManagerPath + "/results/deployments-update/" + jobID
    return <Observable<DeploymentUpdateJobResult>>this.http.get(url)
  }

  getDeploymentsDeleteResult(jobID: string): Observable<DeploymentDeleteJobResult> {
    var url = this.moduleManagerPath + "/results/deployments-delete/" + jobID
    return <Observable<DeploymentDeleteJobResult>>this.http.get(url)
  }

  getRepositoriesRefreshResult(jobID: string): Observable<RepositoryJobResult> {
    var url = this.moduleManagerPath + "/results/repositories-refresh/" + jobID
    return <Observable<RepositoryJobResult>>this.http.get(url)
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.moduleManagerPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }

}
