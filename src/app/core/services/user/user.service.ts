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
import {DeviceUsersResponse, HumanUser, HumanUsersResponse, UserRequest} from 'src/app/system/models/users';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  userPath = '/auth-service';
  identitiesPath = '/identities';
  pairingPath = '/pairing';

  constructor(private http: ApiService) {}

  listUsers<T>(type?: string): Observable<T> {
    let queryParams = new HttpParams();
    if (type) {
      queryParams = queryParams.set('type', type);
    }
    return this.http.get(this.userPath + this.identitiesPath, queryParams) as Observable<T>;
  }

  getUser(userId: string) {
    return this.http.get(this.userPath + this.identitiesPath + '/' + userId) as Observable<HumanUser>;
  }

  listHumanUsers() {
    return this.listUsers<HumanUsersResponse>('human');
  }

  listDeviceUsers() {
    return this.listUsers<DeviceUsersResponse>('machine');
  }

  addUser(userRequest: UserRequest) {
    return this.http.post(this.userPath + this.identitiesPath, userRequest, undefined, 'text');
  }

  deleteUser(userID: string) {
    return this.http.delete(this.userPath + this.identitiesPath + '/' + userID);
  }

  openPairingMode() {
    const url = this.userPath + this.pairingPath + '/open';
    return this.http.patch(url, {withCredentials: true});
  }

  closePairingMode() {
    const url = this.userPath + this.pairingPath + '/close';
    return this.http.patch(url, {withCredentials: true});
  }

  editUser(userID: string, user: UserRequest) {
    return this.http.patch(this.userPath + this.identitiesPath + '/' + userID, user, undefined, 'text');
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.userPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
