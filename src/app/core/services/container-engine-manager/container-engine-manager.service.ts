import {HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {InfoResponse} from '../../models/info';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ContainerEngineManagerService {
  ceWrapperPath = '/ce-wrapper';

  constructor(private http: ApiService) {}

  getContainerLogs(containerID: string, max_lines: number): Observable<string> {
    const url = this.ceWrapperPath + '/logs/' + containerID;
    let queryParams = new HttpParams();
    queryParams = queryParams.set('max_lines', max_lines);
    return this.http.get(url, queryParams, 'text') as Observable<string>;
  }

  getInfo(): Observable<InfoResponse> {
    const url = this.ceWrapperPath + '/info';
    return this.http.get(url) as Observable<InfoResponse>;
  }
}
