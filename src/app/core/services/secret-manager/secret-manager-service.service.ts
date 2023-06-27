import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Secret } from 'src/app/secrets/models/secret_models';
import { ApiService } from '../../../core/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerServiceService {

  constructor(private http: ApiService) {}

  getSecrets(): Observable<Secret[]> {
    return <Observable<Secret[]>>this.http.get("/secrets")
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }
}
