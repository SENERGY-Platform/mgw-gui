import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api/api.service';
import { Secret } from '../../models/secret_models';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerServiceService {

  constructor(private http: ApiService) {}

  loadAvailableSecretTypes(): Observable<Secret[]> {
    //return this.http.get("/secrets")
    return new Observable((subscriber) => {
      var template = [{"type": "basic-auth", "id": "login", "name": "login"}, {"type": 'certificate', 'id': 'cert', "name": "cert"}]
      subscriber.next(template)
      subscriber.complete()
    }) 
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }
}
