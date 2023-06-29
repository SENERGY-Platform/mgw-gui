import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApiService } from '../../../core/services/api/api.service';
import { Secret, SecretType, SecretTypes } from '../../../secrets/models/secret_models';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerMockService {

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    return new Observable((subscriber) => {
      var template = [
        {"type": SecretTypes.APIKey, "id": "login", "name": "API KEY", "value": "kjhsdfjkshfsjkdfh"},
        {"type": SecretTypes.BasicAuth, "id": "login", "name": "Login data", "value": ""}, 
        {"type": SecretTypes.Certificate, 'id': 'cert', "name": "Certificate", "value": "certificate"}
      ]
      subscriber.next(template)
      subscriber.complete()
    }) 
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }

  getSecretTypes(): Observable<SecretType[]>  {
    var types = [{"name": "Certificate", "id": SecretTypes.Certificate }, {"name": "API Key", "id": SecretTypes.APIKey}, {"name": "Credentials", "id": SecretTypes.BasicAuth}]
    return of(types).pipe(delay(200))
  }
}
