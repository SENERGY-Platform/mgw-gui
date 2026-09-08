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

import {HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ContainerEngineManagerService {
  ceWrapperPath = '/ce-wrapper';

  constructor(private http: ApiService) {}

  getContainerLogs(containerID: string, max_lines: number): Observable<string> {
    const url = this.ceWrapperPath + '/logs/' + containerID;
    let queryParams = new HttpParams();
    queryParams = queryParams.set('max_lines', max_lines);
    return this.http.get(url, queryParams, 'text') as Observable<string>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.ceWrapperPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
