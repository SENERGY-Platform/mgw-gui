import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from 'src/environments/environment';

@Injectable()
export class AuthCheckInterceptor implements HttpInterceptor {

  constructor() {
  }

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(httpRequest).pipe(
      map(event => {
        return event;
      }),
      catchError(err => {
        console.log("ERRR")
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            window.location.href = environment.uiBaseUrl + "/login"
          }
        }
        return throwError(() => err);
      })
    )
  }
}
