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
export class ModuleManagerServiceService {
  moduleManagerPath = "/module-manager"

  constructor(
    private http: ApiService,
    private errorService: ErrorService
  ) { }  
  
  public deployModule(deploymentRequest: DeploymentRequest): Observable<JobResponse> {
    var path = this.moduleManagerPath + "/modules" 
    // returns deployment id 
    return this.http.post(path, deploymentRequest);
  }  

  public loadDeploymentTemplate(module_id: string): Observable<DeploymentTemplate>  {
    var url = this.moduleManagerPath + "/modules/" + encodeURIComponent(module_id) + '/depTemplate' 
    return <Observable<DeploymentTemplate>>this.http.get(url);
  }

  public loadModules(): Observable<Module[]> {
    var url = this.moduleManagerPath + "/modules" 
    return <Observable<Module[]>>this.http.get(url);
  } 
  
  public loadDeployments(): Observable<Deployment[]> {
    var url = this.moduleManagerPath + "/deployments" 
    return <Observable<Deployment[]>>this.http.get<Deployment[]>(url);
  }  

  public loadDeployment(deploymentID: string): Observable<Deployment> {
   var url = this.moduleManagerPath + "/deployments/" + deploymentID 
   return <Observable<Deployment>>this.http.get(url);
  }

  public loadDeploymentUpdateTemplate(module_id: string): Observable<DeploymentTemplate> {
      var url = this.moduleManagerPath + "/modules/" + encodeURIComponent(module_id) + '/updateTemplate' 
      return <Observable<DeploymentTemplate>>this.http.get(url);
  }

  public controlDeployment(deploymentID: string, action: string, changeDependencies: boolean): Observable<unknown | JobResponse> {
    let params = new HttpParams()
    if(changeDependencies) {
      params.set("depD", "true")
    }

    var url = this.moduleManagerPath + "/deployments" + deploymentID + '/ctrl' 
    var payload = {'cmd': action}
    return this.http.post(url, payload, params).pipe(catchError((error: HttpErrorResponse) => this.errorService.handleError(ModuleManagerServiceService.name, "controlDeployment", error)));
  }

  addModule(module: AddModule): Observable<any> {
   var url = this.moduleManagerPath + "/modules" 
   return this.http.post(url, module).pipe(catchError((error: HttpErrorResponse) => this.errorService.handleError(ModuleManagerServiceService.name, "addModule", error)));
  }

  getJobStatus(jobID: string): Observable<unknown | JobResponse> {
     var url = this.moduleManagerPath + "/jobs/" + jobID
     return this.http.get(url).pipe(catchError((error: HttpErrorResponse) => this.errorService.handleError(ModuleManagerServiceService.name, "getJobStatus", error)));
  }
}