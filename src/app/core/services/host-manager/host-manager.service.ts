import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HostResource} from 'src/app/host/models/models';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class HostManagerService {
  hostManagerPath = "/host-manager"

  constructor(
    private http: ApiService,
  ) {
  }

  getHostResources(): Observable<HostResource[]> {
    return <Observable<HostResource[]>>this.http.get(this.hostManagerPath + "/host-resources")
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.hostManagerPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }
}
