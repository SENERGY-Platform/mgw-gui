import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/services/api/api.service'
import { InitLogoutResponse, RegisterRequest } from './auth.models';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  basePath = "/core/auth"
  loginPath = "/login"
  logoutPath = "/logout"
  registerPath = "/register"

  constructor(private httpClient: HttpClient) {
  }

  initFlow() {
    var url = this.basePath + this.loginPath + "/browser?refresh=true"
    return this.httpClient.get(url, {withCredentials: true});
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
    return this.httpClient.post(url, payload, {headers: headers, withCredentials: true});
  }

  initRegister() {
    var url = this.basePath + this.registerPath + "/browser"
    return this.httpClient.get(url, {withCredentials: true});
  }

  register(flowID: string, username: string, password: string, csrf: string, firstName?: string, lastName?: string) {
    const payload: RegisterRequest = {
      "method": "password",
      "password": password,
      "traits": {
        "username": username,
        "meta": {}
      },
      'csrf_token': csrf
    }
    if(firstName) {
      payload.traits.meta["first_name"] = firstName;
    }
    if(lastName) {
      payload.traits.meta["last_name"] = lastName;
    }

    var url = this.basePath + this.registerPath + "?flow=" + flowID;
    const headers = new HttpHeaders().set("Accept", "application/json")
    // .set("X-CSRF-Token", csrf) dont use -> or set allowed headers in kratos cors setting to this
    return this.httpClient.post(url, payload, {headers: headers, withCredentials: true});
  }

  initLogout() {
    var url = this.basePath + this.logoutPath + '/browser';
    const headers = new HttpHeaders().set("Accept", "application/json")
    return this.httpClient.get<InitLogoutResponse>(url, {headers: headers, withCredentials: true})
  }

  logout(logoutToken: string) {
    var url = this.basePath + this.logoutPath + "?token=" + logoutToken;
    const headers = new HttpHeaders().set("Accept", "application/json")
    return this.httpClient.get(url, {headers: headers, withCredentials: true})
  }
}
