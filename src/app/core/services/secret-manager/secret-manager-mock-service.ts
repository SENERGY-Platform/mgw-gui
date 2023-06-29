import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApiService } from '../../../core/services/api/api.service';
import { Secret, SecretType } from '../../../secrets/models/secret_models';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerMockService {

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    return new Observable((subscriber) => {
      var template = [
        {"type": "single-value", "id": "login", "name": "API KEY", "value": "kjhsdfjkshfsjkdfh"},
        {"type": "basic-auth", "id": "login", "name": "Login data", "value": ""}, 
        {"type": 'certificate', 'id': 'cert', "name": "Certificate", "value": "certificate"}
      ]
      subscriber.next(template)
      subscriber.complete()
    }) 
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }

  getSecretTypes(): Observable<SecretType[]>  {
    var types = [{"name": "Certificate", "id": "cert"}, {"name": "API Key", "id": "key"}, {"name": "Credentials", "id": "basic-auth"}]
    return of(types).pipe(delay(200))
  }
}
