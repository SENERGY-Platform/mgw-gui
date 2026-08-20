/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {BreakpointObserver} from '@angular/cdk/layout';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';
import {MatDivider} from '@angular/material/divider';
import {Subscription, concatMap, filter} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from '../../services/auth/auth.service';
import {ErrorService} from '../../services/util/error.service';
import {ThemeService} from '../../services/theme/theme.service';
import {NAV_ITEMS, NavItem} from './nav.model';

const COLLAPSE_KEY = 'mgw-nav-collapsed';
// below this the drawer switches to an overlay so the content keeps its width
const HANDSET = '(max-width: 1023px)';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    MatDivider,
  ],
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly navItems = NAV_ITEMS;
  readonly uiVersion = environment.uiVersion;

  // narrow viewports get an overlay drawer that starts closed
  readonly compact = signal(false);
  readonly drawerOpen = signal(true);
  // desktop only: icon-width rail instead of the full drawer
  readonly collapsed = signal(false);
  readonly expandedSection = signal<string | null>(null);

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService,
    private breakpointObserver: BreakpointObserver,
    public theme: ThemeService,
  ) {}

  ngOnInit(): void {
    try {
      this.collapsed.set(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch (_) {}

    this.subscriptions.add(
      this.breakpointObserver.observe(HANDSET).subscribe((state) => {
        this.compact.set(state.matches);
        this.drawerOpen.set(!state.matches);
      }),
    );

    this.syncExpandedSection(this.router.url);
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.syncExpandedSection(event.urlAfterRedirects);
          // an overlay drawer would otherwise stay open on top of the new page
          if (this.compact()) {
            this.drawerOpen.set(false);
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDrawer() {
    if (this.compact()) {
      this.drawerOpen.update((open) => !open);
      return;
    }
    this.collapsed.update((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch (_) {}
      return next;
    });
  }

  toggleSection(item: NavItem) {
    // a collapsed rail has no room for children, so expanding navigates instead
    if (this.collapsed() && !this.compact()) {
      this.router.navigateByUrl(item.route);
      return;
    }
    this.expandedSection.update((current) => (current === item.route ? null : item.route));
  }

  isSectionExpanded(item: NavItem): boolean {
    return this.expandedSection() === item.route;
  }

  isSectionActive(item: NavItem): boolean {
    return this.router.url === item.route || this.router.url.startsWith(item.route + '/');
  }

  logout() {
    this.authService
      .initLogout()
      .pipe(concatMap((logoutInit) => this.authService.logout(logoutInit.logout_token)))
      .subscribe({
        next: (_) => {
          window.location.href = environment.uiBaseUrl + '/login';
        },
        error: (err) => {
          this.errorService.handleError('ShellComponent', 'logout', err);
        },
      });
  }

  private syncExpandedSection(url: string) {
    const section = this.navItems.find(
      (item) => item.children?.length && (url === item.route || url.startsWith(item.route + '/')),
    );
    this.expandedSection.set(section ? section.route : null);
  }
}
