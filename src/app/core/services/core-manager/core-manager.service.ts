/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {CoreEndpointAliasReq, CoreEndpointsResponse} from 'src/app/deployments/models/endpoints';
import {Job} from 'src/app/system/models/job.model';
import {CoreServicesResponse} from 'src/app/system/models/services';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';
import {Log} from '../../../system/models/logs';
import {HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CoreManagerService {
  coreManagerPath = '/core-manager';

  constructor(private http: ApiService) {}

  getEndpoints(deploymentId?: string): Observable<CoreEndpointsResponse> {
    let url = this.coreManagerPath + '/endpoints';
    if (deploymentId != null) {
      url = url + '?ref=' + deploymentId;
    }
    return this.http.get(url, undefined, undefined, false) as Observable<CoreEndpointsResponse>;
  }

  createEndpointAlias(aliasReq: CoreEndpointAliasReq): Observable<any> {
    const url = this.coreManagerPath + '/endpoints/' + aliasReq.parent_id + '/alias';
    return this.http.post(url, aliasReq, undefined, 'text') as Observable<any>;
  }

  deleteEndpoint(endpointID: string): Observable<any> {
    const url = this.coreManagerPath + '/endpoints/' + endpointID;
    return this.http.delete(url, undefined, undefined, 'text') as Observable<any>;
  }

  deleteEndpoints(endpointIDs: string[]): Observable<any> {
    const url = this.coreManagerPath + '/endpoints-batch?ids=' + endpointIDs.join(',');
    return this.http.delete(url, undefined, undefined, 'text') as Observable<any>;
  }

  getServices(): Observable<CoreServicesResponse> {
    const url = this.coreManagerPath + '/core-services';
    return this.http.get(url, undefined, undefined, false) as Observable<CoreServicesResponse>;
  }

  reloadService(serviceID: string) {
    const url = this.coreManagerPath + '/core-services/' + serviceID + '/restart';
    return this.http.patch(url, undefined, undefined, 'text') as Observable<string>;
  }

  getJobStatus(jobID: string): Observable<Job> {
    const url = this.coreManagerPath + '/jobs/' + jobID;
    return this.http.get(url) as Observable<Job>;
  }

  stopJob(jobID: string): Observable<any> {
    const url = this.coreManagerPath + '/jobs/' + jobID + '/cancel';
    return this.http.patch(url) as Observable<any>;
  }

  getJobs(): Observable<Job[]> {
    const url = this.coreManagerPath + '/jobs';
    return this.http.get(url) as Observable<Job[]>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.coreManagerPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }

  getLogs(): Observable<Log[]> {
    const url = this.coreManagerPath + '/logs';
    return this.http.get(url) as Observable<Log[]>;
  }

  getLog(logID: string, max_lines: number): Observable<string> {
    const url = this.coreManagerPath + '/logs/' + logID;
    let queryParams = new HttpParams();
    queryParams = queryParams.set('max_lines', max_lines);
    return this.http.get(url, queryParams, 'text') as Observable<string>;
  }
}
