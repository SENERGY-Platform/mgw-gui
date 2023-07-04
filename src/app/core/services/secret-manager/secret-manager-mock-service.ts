import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApiService } from '../../../core/services/api/api.service';
import { CreateSecret, Secret, SecretType, SecretTypes } from '../../../secrets/models/secret_models';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerMockService {

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    var secrets = [
        {"type": SecretTypes.APIKey, "id": "login", "name": "API KEY", "value": "kjhsdfjkshfsjkdfh"},
        {"type": SecretTypes.BasicAuth, "id": "login", "name": "Login data", "value": ""}, 
        {"type": SecretTypes.Certificate, 'id': 'cert', "name": "Certificate", "value": "certificate"}
    ]
    return of(secrets).pipe(delay(1000))
  }

  getSecret(secretID: string): Observable<Secret> {
    var secret = {"type": SecretTypes.APIKey, "id": "login", "name": "API KEY", "value": "kjhsdfjkshfsjkdfh"}
    return of(secret).pipe(delay(1000))
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }

  getSecretTypes(): Observable<SecretType[]>  {
    var types = [{"name": "Certificate", "id": SecretTypes.Certificate }, {"name": "API Key", "id": SecretTypes.APIKey}, {"name": "Credentials", "id": SecretTypes.BasicAuth}]
    return of(types).pipe(delay(1000))
  }

  updateSecret(secretRequest: CreateSecret, id: string): Observable<any>  {
    return of(true).pipe(delay(1000))
  }

  deleteSecret(secretID: string): Observable<any> {
    return of(true).pipe(delay(1000))
  }
}
