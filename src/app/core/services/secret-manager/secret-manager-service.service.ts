import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSecret, Secret, SecretType } from 'src/app/secrets/models/secret_models';
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

  createSecret(secretRequest: CreateSecret) {
    return this.http.post(this.secretManagerPath + "/secrets", secretRequest)
  }

  getSecretTypes(): Observable<SecretType[]>  {
    return <Observable<SecretType[]>>this.http.get(this.secretManagerPath + "/types")
  }
}
