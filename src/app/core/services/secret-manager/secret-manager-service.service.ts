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
