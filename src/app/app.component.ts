import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MGW';

  sections = [{
    "name": "Deployments",
    "icon": "home",
    "link": "/deployments"
  }, {
    "name": "Modules",
    "icon": "settings",
    "link": "/modules"
  }, {
    "name": "Jobs",
    "icon": "work",
    "link": "/jobs"
  }]
}
