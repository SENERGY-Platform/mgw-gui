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

import {Component} from '@angular/core';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {HostApplicationsComponent} from './host-applications/host-applications.component';
import {HostNetItfBlacklistComponent} from './host-net-itf-blacklist/host-net-itf-blacklist.component';
import {HostNetRngBlacklistComponent} from './host-net-rng-blacklist/host-net-rng-blacklist.component';
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-configuration',
  imports: [
    HostApplicationsComponent,
    HostNetItfBlacklistComponent,
    HostNetRngBlacklistComponent,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
  providers: [provideTranslocoScope('system')],
})
export class ConfigurationComponent {}
