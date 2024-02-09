import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreEndpointAliasReq, CoreEndpointsResponse } from 'src/app/deployments/models/endpoints';
import { Job } from 'src/app/mgw-core/models/job.model';
import { CoreServicesResponse } from 'src/app/mgw-core/models/services';
import { InfoResponse } from '../../models/info';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class CoreManagerService {
  coreManagerPath = "/core-manager"

  constructor(
    private http: ApiService,
  ) { } 

  getEndpoints(): Observable<CoreEndpointsResponse> {
    var url = this.coreManagerPath + "/endpoints"
    return <Observable<CoreEndpointsResponse>>this.http.get(url, undefined, undefined, false)
  }

  createEndpointAlias(aliasReq: CoreEndpointAliasReq): Observable<any> {
    var url = this.coreManagerPath + "/endpoints"
    return <Observable<any>>this.http.post(url, aliasReq, undefined, "text")
  }

  deleteEndpoint(endpointID: string): Observable<any> {
    var url = this.coreManagerPath + "/endpoints/" + endpointID
    return <Observable<any>>this.http.delete(url, undefined, undefined, "text")
  }

  deleteEndpoints(endpointIDs: string[]): Observable<any> {
    var url = this.coreManagerPath + "/endpoints-batch?ids=" + endpointIDs.join(',')
    return <Observable<any>>this.http.delete(url, undefined, undefined, "text")
  }

  getServices(): Observable<CoreServicesResponse> {
    var url = this.coreManagerPath + "/core-services"
    return <Observable<CoreServicesResponse>>this.http.get(url, undefined, undefined, false)
  }

  reloadService(serviceID: string) {
    var url = this.coreManagerPath + "/core-services/" + serviceID + "/restart"
    return <Observable<string>>this.http.patch(url, undefined, undefined, "text")
  }

  getJobStatus(jobID: string): Observable<Job> {
    var url = this.coreManagerPath + "/jobs/" + jobID
    return <Observable<Job>>this.http.get(url)
  }

  stopJob(jobID: string): Observable<any> {
    var url = this.coreManagerPath + "/jobs/" + jobID + "/cancel"
    return <Observable<any>>this.http.patch(url)
  }

  getJobs(): Observable<Job[]> {
    var url = this.coreManagerPath + "/jobs"
    return <Observable<Job[]>>this.http.get(url)
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.coreManagerPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }
}
