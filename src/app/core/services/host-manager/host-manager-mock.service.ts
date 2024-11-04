import {Injectable} from '@angular/core';
import {delay, Observable, of} from 'rxjs';
import {HostResource} from 'src/app/host/models/models';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class HostManagerMockService {
  hostManagerPath = "/host-manager"

  constructor(
    private http: ApiService,
  ) {
  }

  getHostResources(): Observable<HostResource[]> {
    var resources = [
      {
        "id": "app:2093119d7ddfa917288995a9142e4cfbacbdd31e",
        "name": "DBus",
        "tags": null,
        "path": "/var/run/dbus/system_bus_socket",
        "type": "serial"
      },
      {
        "id": "serial:95a453a163209818df78a939bcaa45401c566800",
        "name": "usb-1a86_USB2.0-Serial-if00-port0",
        "tags": null,
        "path": "/dev/serial/by-id/usb-1a86_USB2.0-Serial-if00-port0",
        "type": "app"
      }
    ]
    return of(resources).pipe(delay(1000))
  }
}
