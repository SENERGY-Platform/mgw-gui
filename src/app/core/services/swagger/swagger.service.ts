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

import {HttpClient, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, map, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {SwaggerDocument} from 'src/app/developer/models/openapi';

export interface ApiRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: string;
}

export interface ApiCallResult {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  ok: boolean;
  // set when the request never produced an HTTP response at all
  networkError?: string;
}

/**
 * Loads the gateway's swagger documents and executes ad-hoc requests for the
 * developer playground. Deliberately separate from ApiService: that one
 * prefixes every path with the core API base, while the playground has to
 * address arbitrary URLs and needs the raw response rather than a parsed body.
 */
@Injectable({providedIn: 'root'})
export class SwaggerService {
  constructor(private httpClient: HttpClient) {
  }

  loadDocument(url: string): Observable<SwaggerDocument> {
    return this.httpClient.get<SwaggerDocument>(url, {withCredentials: true});
  }

  execute(request: ApiRequest): Observable<ApiCallResult> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(request.query)) {
      if (value !== '') {
        params = params.set(key, value);
      }
    }

    let headers = new HttpHeaders();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value !== '') {
        headers = headers.set(key, value);
      }
    }
    if (request.body !== undefined && !headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const started = performance.now();
    // responseType text: the playground shows the payload as it came in, and a
    // non-JSON error body would otherwise fail to parse and hide the status
    return this.httpClient.request(request.method, request.url, {
      body: request.body,
      headers: headers,
      params: params,
      observe: 'response',
      responseType: 'text',
      withCredentials: true,
    }).pipe(
      map(response => this.toResult(<HttpResponse<string>>response, started)),
      catchError(error => of(this.errorToResult(error, started)))
    );
  }

  private toResult(response: HttpResponse<string>, started: number): ApiCallResult {
    return {
      status: response.status,
      statusText: response.statusText,
      durationMs: Math.round(performance.now() - started),
      headers: this.collectHeaders(response.headers),
      body: response.body ?? '',
      contentType: response.headers.get('content-type') || '',
      ok: response.status >= 200 && response.status < 300,
    };
  }

  private errorToResult(error: any, started: number): ApiCallResult {
    const durationMs = Math.round(performance.now() - started);
    // status 0 means the browser never got a response: blocked, offline, or
    // an address that does not resolve from here
    if (!error || error.status === undefined || error.status === 0) {
      return {
        status: 0,
        statusText: 'No response',
        durationMs: durationMs,
        headers: {},
        body: '',
        contentType: '',
        ok: false,
        networkError: error?.message || 'The request did not reach a server.',
      };
    }
    return {
      status: error.status,
      statusText: error.statusText || '',
      durationMs: durationMs,
      headers: error.headers ? this.collectHeaders(error.headers) : {},
      body: typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? '', null, 2),
      contentType: error.headers?.get('content-type') || '',
      ok: false,
    };
  }

  private collectHeaders(headers: HttpHeaders): Record<string, string> {
    const collected: Record<string, string> = {};
    for (const key of headers.keys()) {
      collected[key] = headers.getAll(key)?.join(', ') || '';
    }
    return collected;
  }
}
