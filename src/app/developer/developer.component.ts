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
import {PageHeaderComponent} from '../core/components/page-header/page-header.component';
import {SwaggerListComponent} from './swagger-list/swagger-list.component';
import {ApiEntry, INTERNAL_APIS, MODULE_APIS, PUBLIC_APIS} from './api-registry';

@Component({
  selector: 'app-developer',
  imports: [PageHeaderComponent, SwaggerListComponent, TranslocoPipe],
  templateUrl: './developer.component.html',
  styleUrl: './developer.component.css',
  providers: [provideTranslocoScope('developer')],
})
export class DeveloperComponent {
  publicApis: ApiEntry[] = PUBLIC_APIS;
  moduleApis: ApiEntry[] = MODULE_APIS;
  internalApis: ApiEntry[] = INTERNAL_APIS;
}
