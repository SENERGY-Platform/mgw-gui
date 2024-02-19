import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Gateway';
  authPageIsActive = false;

  constructor() {
    const path = location.pathname;
    this.authPageIsActive = path.startsWith(environment.uiBaseUrl + "/login") || path.startsWith(environment.uiBaseUrl + "/register")
  }
}
