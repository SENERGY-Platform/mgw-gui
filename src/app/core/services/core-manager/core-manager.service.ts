import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Job } from 'src/app/jobs/models/job.model';
import { CoreEndpoint, CoreEndpointAliasReq, CoreEndpointsResponse } from 'src/app/mgw-core/models/endpoints';
import { CoreService, CoreServicesResponse } from 'src/app/mgw-core/models/services';
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
    var url = this.coreManagerPath + "/restricted/endpoints"
    return <Observable<CoreEndpointsResponse>>this.http.get(url, undefined, undefined, false)
  }

  createEndpointAlias(aliasReq: CoreEndpointAliasReq): Observable<any> {
    var url = this.coreManagerPath + "/restricted/endpoints"
    return <Observable<any>>this.http.post(url, aliasReq, undefined, "text")
  }

  deleteEndpoint(endpointID: string): Observable<any> {
    var url = this.coreManagerPath + "/restricted/endpoints/" + endpointID
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
}
