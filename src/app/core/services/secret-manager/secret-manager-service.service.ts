import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
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

  getSecret(secretID: string): Observable<Secret> {
    return <Observable<Secret>>this.http.get(this.secretManagerPath + "/secrets/" + secretID)
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

  getVersion(): Observable<string> {
    var url = this.secretManagerPath + "/health-check"
    return this.http.get(url, undefined, undefined, true).pipe(
      map((response: any) => {
        return response.headers.get("X-Api-Version")
      })
    )
  }
}
