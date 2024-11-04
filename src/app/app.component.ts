import {Component} from '@angular/core';
import {environment} from 'src/environments/environment';
import {NgIf} from '@angular/common';
import {MainNavigationComponent} from './core/components/main-navigation/main-navigation.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [NgIf, MainNavigationComponent, RouterOutlet]
})
export class AppComponent {
  title = 'Gateway';
  authPageIsActive = false;

  constructor() {
    const path = location.pathname;
    this.authPageIsActive = path.startsWith(environment.uiBaseUrl + "/login") || path.startsWith(environment.uiBaseUrl + "/register")
  }
}
