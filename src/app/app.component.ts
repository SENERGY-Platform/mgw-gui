import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MGW';

  sections = [{
    "name": "Modules",
    "icon": "home",
    "link": "/modules"
  }, {
    "name": "Settings",
    "icon": "settings",
    "link": "/settings"
  }]
}
