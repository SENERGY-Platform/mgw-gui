import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class SecretManagerServiceService {

  constructor(private http: ApiService) {}

  loadAvailableSecretTypes() {
    return this.http.get("/secrets")
  }

  createSecret(type: string, name: string, value: string) {
    return this.http.post("/secret", {"type": type, "name": name, "value": value})
  }
}
