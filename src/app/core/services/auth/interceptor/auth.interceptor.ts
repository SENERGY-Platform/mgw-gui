import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, filter, map, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthCheckInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      return next.handle(httpRequest).pipe(
          map(event => {
            return event;
          }),
          catchError(err => {
            if(err instanceof HttpErrorResponse) {
              if(err.status === 401) {
                window.location.href = environment.uiBaseUrl + "/login" 
              }
            }
            return throwError(() => err);
          })
      )
  }
}