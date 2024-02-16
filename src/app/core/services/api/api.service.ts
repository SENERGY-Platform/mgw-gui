/*
 *
 *     Copyright 2018 InfAI (CC SES)
 *
 *     Licensed under the Apache License, Version 2.0 (the “License”);
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an “AS IS” BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';


@Injectable({
    providedIn: 'root'
  })
export class ApiService {
    public baseUrl: string = '/api'; // TODO IMPORTANT "/api"

    constructor(private httpClient: HttpClient) {
    }

    public get<T>(path: string, queryParams?: HttpParams, responseType?: string, withHeaders?: boolean): Observable<unknown> {
        var options: any = {params: queryParams}
        if(responseType) {
            options['responseType'] = responseType
        }
        if(withHeaders) {
            options["observe"] = "response"
        }
        options.withCredentials = true;

        return this.httpClient.get<T>(this.baseUrl + path, options);
    }

    public post<T>(path: string, payload?: any, queryParams?: HttpParams, responseType?: string, headers?: HttpHeaders): Observable<unknown> {
        var options: any = {params: queryParams}
        if(responseType) {
            options['responseType'] = responseType
        }

        if(headers) {
            options.headers = headers
        }
        options.withCredentials = true;

        return this.httpClient.post<T>(this.baseUrl + path, payload, options);
    }

    public put(path: string, payload: any): Observable<unknown> {
        var options: any = {
            withCredentials: true
        }
        return this.httpClient.put(this.baseUrl + path, payload, options);
    }

    public delete(path: string, payload?: any, queryParams?: HttpParams, responseType?: string): Observable<unknown> {
        var options: any = {
            params: queryParams,
            body: payload
        }
        if(responseType) {
            options['responseType'] = responseType
        }
        options.withCredentials = true;

        return this.httpClient.delete(this.baseUrl + path, options);
    }

    public patch(path: string, payload?: any, queryParams?: HttpParams, responseType?: string): Observable<unknown> {
        var options: any = {params: queryParams}
        if(responseType) {
            options['responseType'] = responseType
        }
        options.withCredentials = true;

        return this.httpClient.patch(this.baseUrl + path, payload, options);
    }
}