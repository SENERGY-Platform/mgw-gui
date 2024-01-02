import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HostResource } from 'src/app/host/models/models';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class HostManagerService {
  hostManagerPath = "/host-manager"

  constructor(
    private http: ApiService,
  ) { } 
  
  getHostResources(): Observable<HostResource[]> {
    return <Observable<HostResource[]>>this.http.get(this.hostManagerPath + "/host-resources")
  }

  getVersion(): Observable<string> {
    var url = this.hostManagerPath + "/host-resources"
    return this.http.get(url, undefined, undefined, true).pipe(
      map((response: any) => {
        return response.headers.get("X-Api-Version")
      })
    )
  }
}
