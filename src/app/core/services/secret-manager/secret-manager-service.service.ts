import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSecret, Secret, SecretRequest, SecretType } from 'src/app/secrets/models/secret_models';
import { ApiService } from '../../../core/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerServiceService {
  secretManagerPath = "/secret-manager"

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    return <Observable<Secret[]>>this.http.get(this.secretManagerPath + "/secrets")
  }

  getSecret(secretRequest: SecretRequest): Observable<Secret> {
    return <Observable<Secret>>this.http.post(this.secretManagerPath + "/secret", secretRequest)
  }

  createSecret(secretRequest: CreateSecret) {
    return this.http.post(this.secretManagerPath + "/secrets", secretRequest, undefined, "text")
  }

  getSecretTypes(): Observable<SecretType[]>  {
    return <Observable<SecretType[]>>this.http.get(this.secretManagerPath + "/types")
  }

  updateSecret(secretRequest: CreateSecret, id: string): Observable<any>  {
    return <Observable<any>>this.http.put(this.secretManagerPath + "/secrets/" + id , secretRequest)
  }

  deleteSecret(secretID: string): Observable<any> {
    return <Observable<any>>this.http.delete(this.secretManagerPath + "/secrets/" + secretID)
  }
}
