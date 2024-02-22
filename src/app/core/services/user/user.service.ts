import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRequest, UsersResponse } from 'src/app/mgw-core/models/users';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  userPath = "/auth-service"
  identitiesPath = "/identities"

  constructor(private http: ApiService) {}

  listUsers(): Observable<UsersResponse> {
    return <Observable<UsersResponse>>this.http.get(this.userPath+this.identitiesPath);
  }

  addUser(userRequest: UserRequest) {
    return this.http.post(this.userPath+this.identitiesPath, userRequest, undefined, "text");
  }

  deleteUser(userID: string) {
    return this.http.delete(this.userPath + this.identitiesPath + "/" + userID);
  }

}
