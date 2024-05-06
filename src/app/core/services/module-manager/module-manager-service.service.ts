import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AddModule, Module, ModuleResponse, ModuleUpdate, ModuleUpdatePrepare, ModuleUpdateRequest, ModuleUpdates } from '../../../modules/models/module_models';
import { Deployment, DeploymentRequest, DeploymentResponse, DeploymentTemplate, ModuleUpdateTemplate } from 'src/app/deployments/models/deployment_models';
import { InfoResponse } from '../../models/info';
import { Job } from 'src/app/mgw-core/models/job.model';
import { AuxDeployment, AuxDeploymentResponse } from 'src/app/deployments/models/sub-deployments';

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerService {
  moduleManagerPath = "/module-manager"

  constructor(
    private http: ApiService,
  ) { }  

  doubleEncode(moduleID: string) {
    return encodeURIComponent(encodeURIComponent(moduleID))
  }
  
  // Modules
  loadDeploymentTemplate(moduleId: string): Observable<DeploymentTemplate >  {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) + '/dep-template' 
    return <Observable<DeploymentTemplate>>this.http.get(url)
  }

  loadModules(): Observable<ModuleResponse> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<ModuleResponse>>this.http.get(url)
  } 

  addModule(module: AddModule): Observable<string> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<string>>this.http.post(url, module, undefined, 'text')
   }

  deleteModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) 
    return this.http.delete(url, undefined, undefined, 'text')
  }

  loadModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) 
    return this.http.get(url)
  }

  // Module Update
  checkForUpdates(): Observable<string> {
    var url = this.moduleManagerPath + "/updates" 
    return <Observable<string>>this.http.post(url, undefined, undefined, "text")
  }

  getAvailableUpdates(): Observable<ModuleUpdates> {
    var url = this.moduleManagerPath + "/updates" 
    return <Observable<ModuleUpdates>>this.http.get(url)
  }

  getAvailableModuleUpdates(moduleID: string) {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) 
    return <Observable<ModuleUpdate>>this.http.get(url)
  }

  prepareModuleUpdate(moduleID: string, payload: ModuleUpdatePrepare): Observable<string> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) + '/prepare' 
    return <Observable<string>>this.http.patch(url, payload, undefined, "text")
  }

  getModuleUpdateTemplate(moduleID: string): Observable<ModuleUpdateTemplate> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) + '/upt-template' 
    return <Observable<ModuleUpdateTemplate>>this.http.get<ModuleUpdateTemplate>(url)
  }

  cancelModuleUpdate(moduleID: string): Observable<string> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) + '/cancel' 
    return <Observable<string>>this.http.patch(url, undefined, undefined, "text")
  }

  updateModule(moduleID: string, deploymentRequest: ModuleUpdateRequest): Observable<string>  {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) 
    return <Observable<string>>this.http.patch(url, deploymentRequest, undefined, "text")
  }

  // Deployments
  deployModule(deploymentRequest: DeploymentRequest): Observable<string> {
    var path = this.moduleManagerPath + "/deployments" 
    // returns deployment id 
    return <Observable<string>>this.http.post(path, deploymentRequest, undefined, 'text');
  }  

  loadDeployments(withContainerInfo: boolean): Observable<DeploymentResponse> {
    var url = this.moduleManagerPath + "/deployments"
    let queryParams = new HttpParams()
    if(withContainerInfo) {
      queryParams = queryParams.set("container_info", "true")
    }
    return <Observable<DeploymentResponse>>this.http.get<Deployment[]>(url, queryParams);
  }  

  loadDeployment(deploymentID: string, withContainerInfo: boolean, withAssetsInfo: boolean): Observable<Deployment> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID 
    let queryParams = new HttpParams()
    if(withContainerInfo) {
      queryParams = queryParams.set("container_info", "true")
    }
    if(withAssetsInfo) {
      queryParams = queryParams.set("assets", "true")
    }
    return <Observable<Deployment>>this.http.get(url, queryParams);
  }

  updateDeployment(deploymentID: string, update: any): Observable<string> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID 
    return <Observable<string>>this.http.patch(url, update, undefined, "text");
  }

  deleteDeployment(deploymentID: string, forceConfirmed: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID 
    let queryParams = new HttpParams()
    if(forceConfirmed) {
      queryParams = queryParams.set("force", "true")
    }
    return <Observable<any>>this.http.delete(url, undefined, queryParams, 'text');
   }

  deleteDeployments(deploymentIDs: string[], forceConfirmed: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments-batch/delete" 
    let queryParams = new HttpParams()
    if(forceConfirmed) {
      queryParams = queryParams.set("force", "true")
    }
    queryParams = queryParams.set("ids", deploymentIDs.join(","))
    return <Observable<any>>this.http.patch(url, undefined, queryParams, 'text');
  }

  loadDeploymentUpdateTemplate(moduleId: string): Observable<DeploymentTemplate> {
      var url = this.moduleManagerPath + "/deployments/" + this.doubleEncode(moduleId) + '/upt-template' 
      return <Observable<DeploymentTemplate>>this.http.get(url);
  }

  stopDeployment(deploymentID: string, forceConfirmed: boolean): Observable<string> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/stop' 
    let queryParams = new HttpParams()
    if(forceConfirmed) {
      queryParams = queryParams.set("force", "true")
    }
    return <Observable<string>>this.http.patch(url, null, queryParams, 'text')
  }

  stopDeployments(deploymentIDs: string[], forceConfirmed: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments-batch/stop" 
    let queryParams = new HttpParams()
    if(forceConfirmed) {
      queryParams = queryParams.set("force", "true")
    }
    queryParams = queryParams.set("ids", deploymentIDs.join(","))
    return <Observable<any>>this.http.patch(url, undefined, queryParams, 'text');
   }

  startDeployment(deploymentID: string, dependencies: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/start' 
    let queryParams = new HttpParams()
    if(dependencies) {
      queryParams = queryParams.set("dependencies", "true")
    }
    return this.http.patch(url, null, queryParams, 'text')
  }

  startDeployments(deploymentIDs: string[], dependencies: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments-batch/start" 
    let queryParams = new HttpParams()
    if(dependencies) {
      queryParams = queryParams.set("dependencies", "true")
    }
    queryParams = queryParams.set("ids", deploymentIDs.join(","))
    return this.http.patch(url, undefined, queryParams, 'text')
  }

  restartDeployment(deploymentID: string): Observable<string> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/restart' 
    return  <Observable<string>>this.http.patch(url, null, undefined, 'text')
  }

  restartDeployments(deploymentIDs: string[]): Observable<string> {
    var url = this.moduleManagerPath + "/deployments-batch/restart" 
    let queryParams = new HttpParams()
    queryParams = queryParams.set("ids", deploymentIDs.join(","))
    return  <Observable<string>>this.http.patch(url, undefined, queryParams, 'text')
  }

  // Sub Deployments
  getSubDeployment(deploymentID: string, subDeploymentID: string) {
    var url = this.moduleManagerPath + "/aux-deployments/" + subDeploymentID; 
    return <Observable<AuxDeployment>>this.http.get(url, undefined, 'text', undefined, this.getSubDeploymentHeader(deploymentID))
  }

  private getSubDeploymentHeader(deploymentID: string) {
    let headers = new HttpHeaders();
    headers = headers.set("X-MGW-DID", deploymentID)
    return headers 
  }

  getSubDeployments(deploymentID: string) {
    var url = this.moduleManagerPath + "/aux-deployments" 
    return <Observable<AuxDeploymentResponse>>this.http.get(url, undefined, 'json', undefined, this.getSubDeploymentHeader(deploymentID))
  }

  restartSubDeployment(deploymentID: string, subDeploymentID: string) {
    var url = this.moduleManagerPath + "/aux-deployments/" + subDeploymentID + "/restart" 
    return <Observable<string>>this.http.patch(url, undefined, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  restartSubDeployments(deploymentID: string, subDeploymentIDs: string[]) {
    var url = this.moduleManagerPath + "/aux-deployments-batch/restart" 
    let queryParams = new HttpParams()
    queryParams = queryParams.set("ids", subDeploymentIDs.join(","))
    return <Observable<string>>this.http.patch(url, queryParams, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  startSubDeployment(deploymentID: string, subDeploymentID: string) {
    var url = this.moduleManagerPath + "/aux-deployments/" + subDeploymentID + "/start" 
    return <Observable<string>>this.http.patch(url, undefined, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  startSubDeployments(deploymentID: string, subDeploymentIDs: string[]) {
    var url = this.moduleManagerPath + "/aux-deployments-batch/start" 
    let queryParams = new HttpParams()
    queryParams = queryParams.set("ids", subDeploymentIDs.join(","))
    return <Observable<string>>this.http.patch(url, queryParams, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  stopSubDeployment(deploymentID: string, subDeploymentID: string) {
    var url = this.moduleManagerPath + "/aux-deployments/" + subDeploymentID + "/stop" 
    return <Observable<string>>this.http.patch(url, undefined, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  stopSubDeployments(deploymentID: string, subDeploymentIDs: string[]) {
    var url = this.moduleManagerPath + "/aux-deployments-batch/stop" 
    let queryParams = new HttpParams()
    queryParams = queryParams.set("ids", subDeploymentIDs.join(","))
    return <Observable<string>>this.http.patch(url, queryParams, undefined, 'text', this.getSubDeploymentHeader(deploymentID))
  }

  // Jobs

  getJobStatus(jobID: string): Observable<Job> {
     var url = this.moduleManagerPath + "/jobs/" + jobID
     return <Observable<Job>>this.http.get(url)
  }

  stopJob(jobID: string): Observable<any> {
    var url = this.moduleManagerPath + "/jobs/" + jobID + "/cancel"
    return <Observable<any>>this.http.patch(url)
  }

  getJobs(): Observable<Job[]> {
    var url = this.moduleManagerPath + "/jobs"
    return <Observable<Job[]>>this.http.get(url)
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.moduleManagerPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }
}