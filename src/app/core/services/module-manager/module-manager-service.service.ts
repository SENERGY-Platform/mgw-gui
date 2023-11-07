import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AddModule, Module, ModuleUpdate, ModuleUpdatePrepare, ModuleUpdateRequest, ModuleUpdates } from '../../../modules/models/module_models';
import { Deployment, DeploymentHealth, DeploymentHealths, DeploymentRequest, DeploymentTemplate, ModuleUpdateTemplate } from 'src/app/deployments/models/deployment_models';
import { Job } from 'src/app/jobs/models/job.model';

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

  loadModules(): Observable<Module[]> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<Module[]>>this.http.get(url)
  } 

  addModule(module: AddModule): Observable<string> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<string>>this.http.post(url, module, undefined, 'text')
   }

  deleteModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) 
    return this.http.delete(url)
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

  getAvailableModuleUpdates(moduleID: string): Observable<ModuleUpdate> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) 
    return <Observable<ModuleUpdate>>this.http.get(url)
  }

  prepareModuleUpdate(moduleID: string, payload: ModuleUpdatePrepare): Observable<string> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) + '/prepare' 
    return <Observable<string>>this.http.patch(url, payload, undefined, "text")
  }

  getModuleUpdateTemplate(moduleID: string): Observable<ModuleUpdateTemplate> {
    var url = this.moduleManagerPath + "/updates/" + this.doubleEncode(moduleID) + '/upt-template' 
    return <Observable<ModuleUpdateTemplate>>this.http.get(url)
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

  loadDeployments(): Observable<Deployment[]> {
    var url = this.moduleManagerPath + "/deployments" 
    return <Observable<Deployment[]>>this.http.get<Deployment[]>(url);
  }  

  loadDeployment(deploymentID: string): Observable<Deployment> {
   var url = this.moduleManagerPath + "/deployments/" + deploymentID 
   return <Observable<Deployment>>this.http.get(url);
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
    return <Observable<any>>this.http.delete(url, undefined, queryParams);
   }

  deleteDeployments(deploymentIDs: string[], forceConfirmed: boolean): Observable<any> {
    var url = this.moduleManagerPath + "/deployments-batch" 
    let queryParams = new HttpParams()
    if(forceConfirmed) {
      queryParams = queryParams.set("force", "true")
    }
    return <Observable<any>>this.http.delete(url, deploymentIDs, queryParams);
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
    return <Observable<any>>this.http.post(url, deploymentIDs, queryParams, 'text');
   }

  startDeployment(deploymentID: string): Observable<any> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/start' 
    return this.http.patch(url)
  }

  startDeployments(deploymentIDs: string[]): Observable<any> {
    var url = this.moduleManagerPath + "/deployments-batch/start" 
    return this.http.post(url, deploymentIDs, undefined)
  }

  restartDeployment(deploymentID: string): Observable<string> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/restart' 
    return  <Observable<string>>this.http.patch(url, null, undefined, 'text')
  }

  restartDeployments(deploymentIDs: string[]): Observable<string> {
    var url = this.moduleManagerPath + "/deployments-batch/restart" 
    return  <Observable<string>>this.http.post(url, deploymentIDs, undefined, 'text')
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

  // Health
  getDeploymentsHealth(): Observable<DeploymentHealths> {
    var url = this.moduleManagerPath + "/health"
    return <Observable<DeploymentHealths>>this.http.get(url)
  }

  getDeploymentHealth(deploymentID: string): Observable<DeploymentHealth> {
    var url = this.moduleManagerPath + "/health/" + deploymentID
    return <Observable<DeploymentHealth>>this.http.get(url)
  }
}