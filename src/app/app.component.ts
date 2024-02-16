import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MGW';
  authPageIsActive = false;

  constructor() {
    const path = location.pathname;
    this.authPageIsActive = path.startsWith("/login") || path.startsWith("/register")
  }
}
