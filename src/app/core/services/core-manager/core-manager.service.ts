import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreEndpoint, CoreEndpointsResponse } from 'src/app/mgw-core/models/endpoints';
import { CoreService, CoreServicesResponse } from 'src/app/mgw-core/models/services';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class CoreManagerService {
  hostManagerPath = "/core-manager"

  constructor(
    private http: ApiService,
  ) { } 

  getEndpoints(): Observable<CoreEndpointsResponse> {
    var url = this.hostManagerPath + "/restricted/endpoints"
    return <Observable<CoreEndpointsResponse>>this.http.get(url, undefined, undefined, false)
  }

  createEndpointAlias(alias: string): Observable<any> {
    var url = this.hostManagerPath + "/restricted/endpoints"
    return <Observable<any>>this.http.post(url, alias, undefined, undefined)
  }

  deleteEndpoint(endpointID: string): Observable<any> {
    var url = this.hostManagerPath + "/restricted/endpoints/" + endpointID
    return <Observable<any>>this.http.delete(url, undefined, undefined, undefined)
  }

  getServices(): Observable<CoreServicesResponse> {
    var url = this.hostManagerPath + "/core-services"
    return <Observable<CoreServicesResponse>>this.http.get(url, undefined, undefined, false)
  }

  reloadService(serviceID: string) {
    var url = this.hostManagerPath + "/core-services/" + serviceID + "/restart"
    return <Observable<CoreServicesResponse>>this.http.patch(url, undefined, undefined, undefined)
  }
}
