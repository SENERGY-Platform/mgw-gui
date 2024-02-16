import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/services/api/api.service'
import { RegisterRequest } from './auth.models';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  basePath = "/auth"
  loginPath = "/login"
  logoutPath = "/logout"

  constructor(private apiService: ApiService) { 
  }

  initFlow() {
    var url = this.basePath + this.loginPath + "/browser?refresh=true"
    return this.apiService.get(url);
  }

  login(flowID: string, username: string, password: string, csrf: string) {
    const payload = {
      "identifier": username,
      "method": "password",
      "password": password,
      'csrf_token': csrf
    }
    var url = this.basePath + this.loginPath + "?flow=" + flowID ;
    const headers = new HttpHeaders().set("Accept", "application/json")
    // .set("X-CSRF-Token", csrf) dont use -> or set allowed headers in kratos cors setting to this 
    return this.apiService.post(url, payload, undefined, undefined, headers);
  }

  initRegister() {
    var url = this.basePath + this.loginPath + "self-service/registration/browser"
    return this.apiService.get(url);
  }

  register(flowID: string, username: string, password: string, csrf: string, firstName?: string, lastName?: string) {
    const payload: RegisterRequest = {
      "method": "password",
      "password": password,
      "traits": {
        "username": username,
      },
      'csrf_token': csrf
    }
    if(firstName) {
      payload.traits["name"] = firstName; 
    }
    if(lastName) {
      payload.traits["surname"] = lastName;
    }

    var url = this.basePath + "self-service/registration?flow=" + flowID;
    const headers = new HttpHeaders().set("Accept", "application/json")
    // .set("X-CSRF-Token", csrf) dont use -> or set allowed headers in kratos cors setting to this 
    return this.apiService.post(url, payload, undefined, undefined, headers);
  }
}
