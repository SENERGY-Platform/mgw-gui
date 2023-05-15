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

import { HttpErrorResponse } from '@angular/common/http';
import {Injectable} from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { NotificationService } from './notifications.service';


@Injectable({
    providedIn: 'root'
  })
export class ErrorService {
  constructor(private notifierService: NotificationService) {}
    
  handleError(service: string, method: string, error: HttpErrorResponse) {
        console.error('Error =>> Service: ' + service + ' =>> Method: ' + method);
        this.notifierService.showError("There was a problem")
        
        if (error.status === 0) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong.
          console.error(
            `Backend returned code ${error.status}, body was: `, error.error);
        }
        // Return an observable with a user-facing error message.
        return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}