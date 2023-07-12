import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ContainerEngineManagerMockService {
  logPath = "/logs"

  constructor() {}

  getContainerLogs(containerID: string, since: Date): Observable<string> {
    var logs = "sljsldjsldksldksdlksdl\nksjklsjd;sdksjdskldjd\nldlfjdkfjdfjkdj"
    return of(logs).pipe(delay(500))
  }
}
