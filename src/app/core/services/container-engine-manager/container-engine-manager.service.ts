import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ContainerEngineManagerService {
  logPath = "/logs"

  constructor(private http: ApiService) {}

  getContainerLogs(containerID: string, max_lines: number): Observable<string> {
    var url = this.logPath + "/" + containerID
    let queryParams = new HttpParams()
    queryParams.set("max_lines", max_lines)
    return <Observable<string>>this.http.get(url, queryParams, "text")
  }
}
