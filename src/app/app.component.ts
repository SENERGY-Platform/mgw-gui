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
    this.authPageIsActive = location.pathname.startsWith("/auth")
  }
}
