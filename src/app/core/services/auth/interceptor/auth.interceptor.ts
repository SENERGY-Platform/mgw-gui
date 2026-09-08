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
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from 'src/environments/environment';

@Injectable()
export class AuthCheckInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      map((event) => {
        return event;
      }),
      catchError((err) => {
        console.log('ERRR');
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            window.location.href = environment.uiBaseUrl + '/login';
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
