import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HostResource} from 'src/app/host/models/models';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';
import {HttpParams} from "@angular/common/http";

export interface AppResponse {
  id: string;
  name: string;
  socket: string;
}

export interface AppRequest {
  name: string;
  socket: string;
}

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

  getApplications(): Observable<AppResponse[]> {
    return <Observable<AppResponse[]>>this.http.get(this.hostManagerPath + "/applications")
  }

  addApplication(application: AppRequest): Observable<any> {
    return <Observable<any>>this.http.post(this.hostManagerPath + "/applications", application, undefined, "text")
  }

  removeApplication(id: string): Observable<any> {
    return <Observable<any>>this.http.delete(this.hostManagerPath + "/applications/" + id, undefined, undefined, "text")
  }

  getBlacklistNetInterfaces(): Observable<string[]> {
    return <Observable<string[]>>this.http.get(this.hostManagerPath + "/blacklists/net-interfaces")
  }

  addBlacklistNetInterface(name: string): Observable<any> {
    return <Observable<any>>this.http.post(this.hostManagerPath + "/blacklists/net-interfaces", name, undefined, undefined)
  }

  removeBlacklistNetInterface(name: string): Observable<any> {
    let queryParams = new HttpParams()
    return <Observable<any>>this.http.delete(this.hostManagerPath + "/blacklists/net-interfaces", undefined, queryParams.set("value", name), undefined)
  }

  getBlacklistNetRanges(): Observable<string[]> {
    return <Observable<string[]>>this.http.get(this.hostManagerPath + "/blacklists/net-ranges")
  }

  addBlacklistNetRanges(range: string): Observable<any> {
    return <Observable<any>>this.http.post(this.hostManagerPath + "/blacklists/net-ranges", range, undefined, undefined)
  }

  removeBlacklistNetRange(range: string): Observable<any> {
    let queryParams = new HttpParams()
    return <Observable<any>>this.http.delete(this.hostManagerPath + "/blacklists/net-ranges", undefined, queryParams.set("value", range), undefined)
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.hostManagerPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }
}
