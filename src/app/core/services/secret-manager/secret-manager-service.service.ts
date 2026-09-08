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
import {CreateSecret, Secret, SecretType} from 'src/app/secrets/models/secret_models';
import {ApiService} from '../../../core/services/api/api.service';
import {InfoResponse} from '../../models/info';

@Injectable({
  providedIn: 'root',
})
export class SecretManagerServiceService {
  secretManagerPath = '/secret-manager';

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    return this.http.get(this.secretManagerPath + '/secrets') as Observable<Secret[]>;
  }

  getSecret(secretID: string): Observable<Secret> {
    return this.http.get(this.secretManagerPath + '/secrets/' + secretID) as Observable<Secret>;
  }

  createSecret(secretRequest: CreateSecret) {
    return this.http.post(this.secretManagerPath + '/secrets', secretRequest, undefined, 'text');
  }

  getSecretTypes(): Observable<SecretType[]> {
    return this.http.get(this.secretManagerPath + '/types') as Observable<SecretType[]>;
  }

  updateSecret(secretRequest: CreateSecret, id: string): Observable<any> {
    return this.http.put(this.secretManagerPath + '/secrets/' + id, secretRequest) as Observable<any>;
  }

  deleteSecret(secretID: string): Observable<any> {
    return this.http.delete(this.secretManagerPath + '/secrets/' + secretID) as Observable<any>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.secretManagerPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
