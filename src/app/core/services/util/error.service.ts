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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {throwError} from 'rxjs';
import {NotificationService} from './notifications.service';


@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private notifierService: NotificationService) {
  }

  handleError(service: string, method: string, error: HttpErrorResponse | Error) {
    // shall handle errors at the backend, e.g. 400/500 and display error response
    // client errors like trying to parse json when response is text
    // client errros like network problems

    var errorMessage
    if (error instanceof HttpErrorResponse) {
      if (typeof (error.error) == 'object') {
        // e.g cant parse response body
        errorMessage = error.message
      } else {
        // backend message
        errorMessage = error.error
      }

      if (error.status === 0) {
        // A client-side or network error occurred before getting a response. Handle it accordingly.
        console.error('A client error occurred:', errorMessage);
      } else {
        // The backend returned an unsuccessful response code.
        // The response body may contain clues as to what went wrong. It is contained in error.error
        console.error(`Backend returned code ${error.status}, Error: `, errorMessage);
      }
    } else {
      // e.g. custom Exception
      errorMessage = error.message
      console.error(errorMessage)
    }

    console.error('Error =>> Service: ' + service + ' =>> Method: ' + method);
    this.notifierService.showError("Error: " + errorMessage)


    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}

// TODO log + error with specific message or return value like []
// ui component show human message
