import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { InfoResponse } from '../../models/info';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ContainerEngineManagerService {
  ceWrapperPath = "/ce-wrapper"

  constructor(private http: ApiService) {}

  getContainerLogs(containerID: string, max_lines: number): Observable<string> {
    var url = this.ceWrapperPath + "/logs/" + containerID
    let queryParams = new HttpParams()
    queryParams = queryParams.set("max_lines", max_lines)
    return <Observable<string>>this.http.get(url, queryParams, "text")
  }

  getInfo(): Observable<InfoResponse> {
    var url = this.ceWrapperPath + "/info"
    return <Observable<InfoResponse>>this.http.get(url);
  }
}
