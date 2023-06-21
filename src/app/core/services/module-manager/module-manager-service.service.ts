import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AddModule, Module } from '../../../modules/models/module_models';
import { Deployment, DeploymentRequest, DeploymentTemplate } from 'src/app/deployments/models/deployment_models';
import { ErrorService } from '../util/error.service';
import { JobResponse } from '../../models/module.models';

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
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) + '/dep_template' 
    return <Observable<DeploymentTemplate>>this.http.get(url)
  }

  loadModules(): Observable<Module[]> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<Module[]>>this.http.get(url)
  } 

  addModule(module: AddModule): Observable<string> {
    var url = this.moduleManagerPath + "/modules" 
    return this.http.post(url, module)
   }

  deleteModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) 
    return this.http.delete(url)
  }

  loadModule(moduleId: string): Observable<any> {
    var url = this.moduleManagerPath + "/modules/" + this.doubleEncode(moduleId) 
    return this.http.get(url)
  }

  // Deployments
  deployModule(deploymentRequest: DeploymentRequest): Observable<any> {
    var path = this.moduleManagerPath + "/deployments" 
    // returns deployment id 
    return this.http.post(path, deploymentRequest);
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
    return <Observable<string>>this.http.patch(url, update);
  }

  deleteDeployment(deploymentID: string): Observable<any> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID 
    return <Observable<any>>this.http.delete(url);
   }

  loadDeploymentUpdateTemplate(moduleId: string): Observable<DeploymentTemplate> {
      var url = this.moduleManagerPath + "/deployments/" + this.doubleEncode(moduleId) + '/upt_template' 
      return <Observable<DeploymentTemplate>>this.http.get(url);
  }

  stopDeployment(deploymentID: string, changeDependencies: boolean): Observable<string> {
    let queryParams = new HttpParams()
    if(changeDependencies) {
      queryParams = queryParams.set("dependencies", "true")
    }

    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/stop' 
    return <Observable<string>>this.http.patch(url, null, queryParams)
  }

  startDeployment(deploymentID: string): Observable<JobResponse> {
    var url = this.moduleManagerPath + "/deployments/" + deploymentID + '/start' 
    return <Observable<JobResponse>>this.http.patch(url)
  }

  getJobStatus(jobID: string): Observable<JobResponse> {
     var url = this.moduleManagerPath + "/jobs/" + jobID
     return <Observable<JobResponse>>this.http.get(url)
  }

  stopJob(jobID: string): Observable<any> {
    var url = this.moduleManagerPath + "/jobs/" + jobID + "/cancel"
    return <Observable<any>>this.http.post(url)
  }

  getJobs(): Observable<JobResponse[]> {
    var url = this.moduleManagerPath + "/jobs"
     return <Observable<JobResponse[]>>this.http.get(url)
  }
}