import {Component} from '@angular/core';

import {ShellComponent} from './core/components/shell/shell.component';
import {RouterOutlet} from '@angular/router';

// Pages that render without the app shell: no navigation before sign-in.
const AUTH_PATHS = ['/login', '/register'];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [ShellComponent, RouterOutlet]
})
export class AppComponent {
  title = 'Gateway';
  authPageIsActive = false;

  constructor() {
    // Matching on the trailing segment rather than on uiBaseUrl keeps the
    // auth pages frameless wherever the app is mounted - under /core/web-ui
    // in a real install, at the root when served by `ng serve`.
    const path = location.pathname.replace(/\/+$/, "");
    this.authPageIsActive = AUTH_PATHS.some(authPath => path === authPath || path.endsWith(authPath))
  }
}
