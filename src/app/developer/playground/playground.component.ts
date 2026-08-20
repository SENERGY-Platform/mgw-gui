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

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {concatMap, of} from 'rxjs';
import {SwaggerService} from 'src/app/core/services/swagger/swagger.service';
import {ApiCallResult} from 'src/app/core/services/swagger/swagger.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {SpinnerComponent} from 'src/app/core/components/spinner/spinner.component';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {ApiEntry, findApi, isExecutable, specUrl} from '../api-registry';
import {MethodChipComponent} from './method-chip.component';
import {OperationGroup, OperationListComponent} from './operation-list.component';
import {ApiOperation, SwaggerDocument, SwaggerParameter, flattenOperations, sampleFor} from '../models/openapi';

/** One editable value in the request form. */
interface ParamField {
  parameter: SwaggerParameter;
  value: string;
}

// Methods that change state on the gateway and therefore ask before running.
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// The public documents also describe the module-facing surface of a service.
// Those paths are served on the gateway-internal network only - calling them
// through the public base URL answers 404.
const RESTRICTED_PREFIX = '/restricted/';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.css'],
  imports: [
    FormsModule,
    MatIcon,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatFormField,
    MatInput,
    SpinnerComponent,
    PageHeaderComponent,
    OperationListComponent,
    MethodChipComponent,
  ],
})
export class PlaygroundComponent implements OnInit {
  api?: ApiEntry;
  doc?: SwaggerDocument;
  ready = false;
  loadError = '';

  groups: OperationGroup[] = [];
  filter = '';
  selected?: ApiOperation;

  pathFields: ParamField[] = [];
  queryFields: ParamField[] = [];
  headerFields: ParamField[] = [];
  bodyField = '';
  hasBody = false;

  sending = false;
  result?: ApiCallResult;

  constructor(
    private route: ActivatedRoute,
    private swaggerService: SwaggerService,
    private errorService: ErrorService,
    private utilService: UtilService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.api = findApi(params['scope'], params['service']);
      this.reset();
      if (!this.api) {
        this.loadError = 'Unknown API.';
        this.ready = true;
        return;
      }
      this.load(this.api);
    });
  }

  executable(): boolean {
    return !!this.api && isExecutable(this.api);
  }

  /** True for operations the browser cannot reach even on an executable API. */
  restricted(operation?: ApiOperation): boolean {
    return !!operation && operation.path.startsWith(RESTRICTED_PREFIX);
  }

  canSend(): boolean {
    return this.executable() && !this.restricted(this.selected);
  }

  select(operation: ApiOperation) {
    this.selected = operation;
    this.result = undefined;
    this.buildForm(operation);
  }

  /** URL the request goes to, with path placeholders substituted. */
  resolvedUrl(): string {
    if (!this.selected || !this.api?.requestBase) {
      return '';
    }
    return this.api.requestBase + this.substitutePath(this.selected.path);
  }

  /** Same URL but absolute, for copying into curl or a browser. */
  displayUrl(): string {
    if (!this.selected || !this.api) {
      return '';
    }
    return this.api.displayUrl + this.substitutePath(this.selected.path);
  }

  copyUrl() {
    navigator.clipboard?.writeText(location.origin + this.resolvedUrl() + this.queryString()).catch(() => {
      // clipboard access can be denied; the URL is visible on screen anyway
    });
  }

  send() {
    if (!this.selected || !this.api?.requestBase || this.sending || !this.canSend()) {
      return;
    }
    const missing = this.pathFields.filter((field) => field.value.trim() === '');
    if (missing.length > 0) {
      this.loadError = 'Fill in the path parameters first: ' + missing.map((f) => f.parameter.name).join(', ');
      return;
    }
    this.loadError = '';

    const method = this.selected.method;
    const confirmation = SAFE_METHODS.includes(method)
      ? of(true)
      : this.utilService.askForConfirmation(
          method +
            ' ' +
            this.displayUrl() +
            '\n\nThis runs against the gateway for real and can change or delete data.',
        );

    confirmation
      .pipe(
        concatMap((confirmed) => {
          if (!confirmed) {
            return of(null);
          }
          this.sending = true;
          this.result = undefined;
          return this.swaggerService.execute({
            method: method,
            url: this.resolvedUrl(),
            headers: this.toRecord(this.headerFields),
            query: this.toRecord(this.queryFields),
            body: this.hasBody && this.bodyField.trim() !== '' ? this.bodyField : undefined,
          });
        }),
      )
      .subscribe({
        next: (result) => {
          this.sending = false;
          if (result) {
            this.result = result;
            // with many parameters the response card starts below the fold
            setTimeout(() => document.getElementById('playground-response')?.scrollIntoView({block: 'nearest'}), 0);
          }
        },
        error: (err) => {
          this.sending = false;
          this.errorService.handleError(PlaygroundComponent.name, 'send', err, 'The request could not be sent');
        },
      });
  }

  formatBody(): string {
    if (!this.result?.body) {
      return '';
    }
    if (!this.result.contentType.includes('json')) {
      return this.result.body;
    }
    try {
      return JSON.stringify(JSON.parse(this.result.body), null, 2);
    } catch (_) {
      // a malformed body is more useful shown verbatim than swallowed
      return this.result.body;
    }
  }

  resultTone(): string {
    if (!this.result) {
      return '';
    }
    if (this.result.status === 0) {
      return 'danger';
    }
    return this.result.ok ? 'ok' : 'danger';
  }

  responseHeaders(): {key: string; value: string}[] {
    return Object.entries(this.result?.headers || {}).map(([key, value]) => ({key, value}));
  }

  applyFilter() {
    this.groups = this.buildGroups();
  }

  prettifyBody() {
    try {
      this.bodyField = JSON.stringify(JSON.parse(this.bodyField), null, 2);
    } catch (_) {
      // leave invalid JSON untouched so the user can see what they typed
    }
  }

  private load(api: ApiEntry) {
    this.swaggerService.loadDocument(specUrl(api)).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.groups = this.buildGroups();
        this.ready = true;
      },
      error: (_) => {
        this.loadError = 'The API description could not be loaded from ' + specUrl(api) + '.';
        this.ready = true;
      },
    });
  }

  private reset() {
    this.doc = undefined;
    this.ready = false;
    this.loadError = '';
    this.groups = [];
    this.selected = undefined;
    this.result = undefined;
    this.filter = '';
  }

  private buildGroups(): OperationGroup[] {
    if (!this.doc) {
      return [];
    }
    const term = this.filter.trim().toLowerCase();
    const operations = flattenOperations(this.doc).filter(
      (operation) =>
        !term || (operation.path + ' ' + operation.method + ' ' + operation.summary).toLowerCase().includes(term),
    );

    const groups: OperationGroup[] = [];
    for (const operation of operations) {
      let group = groups.find((g) => g.tag === operation.tag);
      if (!group) {
        group = {tag: operation.tag, operations: []};
        groups.push(group);
      }
      group.operations.push(operation);
    }
    groups.sort((a, b) => a.tag.localeCompare(b.tag));
    groups.forEach((group) =>
      group.operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
    );
    return groups;
  }

  private buildForm(operation: ApiOperation) {
    this.pathFields = [];
    this.queryFields = [];
    this.headerFields = [];
    this.bodyField = '';
    this.hasBody = false;

    for (const parameter of operation.parameters) {
      const field: ParamField = {
        parameter: parameter,
        value: parameter.default !== undefined ? String(parameter.default) : '',
      };
      switch (parameter.in) {
        case 'path':
          this.pathFields.push(field);
          break;
        case 'query':
          this.queryFields.push(field);
          break;
        case 'header':
          this.headerFields.push(field);
          break;
        case 'body':
          this.hasBody = true;
          if (this.doc) {
            const sample = sampleFor(parameter.schema, this.doc);
            this.bodyField = typeof sample === 'string' ? sample : JSON.stringify(sample, null, 2);
          }
          break;
      }
    }
  }

  private substitutePath(path: string): string {
    let resolved = path;
    for (const field of this.pathFields) {
      const value = field.value.trim();
      resolved = resolved.replace(
        '{' + field.parameter.name + '}',
        value === '' ? '{' + field.parameter.name + '}' : encodeURIComponent(value),
      );
    }
    return resolved;
  }

  private queryString(): string {
    const pairs = this.queryFields
      .filter((field) => field.value.trim() !== '')
      .map((field) => encodeURIComponent(field.parameter.name) + '=' + encodeURIComponent(field.value.trim()));
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  private toRecord(fields: ParamField[]): Record<string, string> {
    const record: Record<string, string> = {};
    for (const field of fields) {
      record[field.parameter.name] = field.value.trim();
    }
    return record;
  }
}
