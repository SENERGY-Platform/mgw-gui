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
import {HostResource} from 'src/app/host/models/models';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';
import {HttpParams} from '@angular/common/http';

export interface AppResponse {
  id: string;
  name: string;
  socket: string;
}

export interface AppRequest {
  name: string;
  socket: string;
}

@Injectable({
  providedIn: 'root',
})
export class HostManagerService {
  hostManagerPath = '/host-manager';

  constructor(private http: ApiService) {}

  getHostResources(): Observable<HostResource[]> {
    return this.http.get(this.hostManagerPath + '/host-resources') as Observable<HostResource[]>;
  }

  getApplications(): Observable<AppResponse[]> {
    return this.http.get(this.hostManagerPath + '/applications') as Observable<AppResponse[]>;
  }

  addApplication(application: AppRequest): Observable<any> {
    return this.http.post(this.hostManagerPath + '/applications', application, undefined, 'text') as Observable<any>;
  }

  removeApplication(id: string): Observable<any> {
    return this.http.delete(
      this.hostManagerPath + '/applications/' + id,
      undefined,
      undefined,
      'text',
    ) as Observable<any>;
  }

  getBlacklistNetInterfaces(): Observable<string[]> {
    return this.http.get(this.hostManagerPath + '/blacklists/net-interfaces') as Observable<string[]>;
  }

  addBlacklistNetInterface(name: string): Observable<any> {
    return this.http.post(
      this.hostManagerPath + '/blacklists/net-interfaces',
      name,
      undefined,
      undefined,
    ) as Observable<any>;
  }

  removeBlacklistNetInterface(name: string): Observable<any> {
    const queryParams = new HttpParams();
    return this.http.delete(
      this.hostManagerPath + '/blacklists/net-interfaces',
      undefined,
      queryParams.set('value', name),
      undefined,
    ) as Observable<any>;
  }

  getBlacklistNetRanges(): Observable<string[]> {
    return this.http.get(this.hostManagerPath + '/blacklists/net-ranges') as Observable<string[]>;
  }

  addBlacklistNetRanges(range: string): Observable<any> {
    return this.http.post(
      this.hostManagerPath + '/blacklists/net-ranges',
      range,
      undefined,
      undefined,
    ) as Observable<any>;
  }

  removeBlacklistNetRange(range: string): Observable<any> {
    const queryParams = new HttpParams();
    return this.http.delete(
      this.hostManagerPath + '/blacklists/net-ranges',
      undefined,
      queryParams.set('value', range),
      undefined,
    ) as Observable<any>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.hostManagerPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
