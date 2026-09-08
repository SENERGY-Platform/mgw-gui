/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Injectable} from '@angular/core';
import {delay, Observable, of} from 'rxjs';
import {HostResource} from 'src/app/host/models/models';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class HostManagerMockService {
  hostManagerPath = '/host-manager';

  constructor(private http: ApiService) {}

  getHostResources(): Observable<HostResource[]> {
    const resources = [
      {
        id: 'app:2093119d7ddfa917288995a9142e4cfbacbdd31e',
        name: 'DBus',
        tags: null,
        path: '/var/run/dbus/system_bus_socket',
        type: 'serial',
      },
      {
        id: 'serial:95a453a163209818df78a939bcaa45401c566800',
        name: 'usb-1a86_USB2.0-Serial-if00-port0',
        tags: null,
        path: '/dev/serial/by-id/usb-1a86_USB2.0-Serial-if00-port0',
        type: 'app',
      },
    ];
    return of(resources).pipe(delay(1000));
  }
}
