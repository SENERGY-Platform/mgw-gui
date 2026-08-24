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

import {Component, OnDestroy, OnInit, inject, signal} from '@angular/core';
import {BreakpointObserver} from '@angular/cdk/layout';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';
import {MatDivider} from '@angular/material/divider';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Subscription, concatMap, filter} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from '../../services/auth/auth.service';
import {ErrorService} from '../../services/util/error.service';
import {ThemeService} from '../../services/theme/theme.service';
import {TelemetryConsentService} from '../../services/telemetry/telemetry-consent.service';
import {TelemetryConsentDialogComponent} from '../telemetry-consent-dialog/telemetry-consent-dialog.component';
import {FeedbackDialogComponent} from '../feedback-dialog/feedback-dialog.component';
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
  // The constructor below predates the inject() convention; new dependencies
  // follow it rather than lengthening the parameter list.
  private readonly dialog = inject(MatDialog);
  private readonly telemetryConsent = inject(TelemetryConsentService);
  /** The consent question, still waiting to be asked. Cleared on destroy. */
  private consentPrompt: ReturnType<typeof setTimeout> | null = null;
  /** The feedback dialog while one is open, so a second cannot be stacked on it. */
  private feedbackDialog: MatDialogRef<FeedbackDialogComponent> | null = null;

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

    // Asked once, on the first start that reaches the shell - so never on the
    // sign-in pages, which render without it. Deferred by a task rather than
    // awaited anywhere: the gateway is usable whether or not the question is
    // answered, and until it is, the level stays at 0.
    if (!this.telemetryConsent.answered()) {
      this.consentPrompt = setTimeout(() => {
        this.consentPrompt = null;
        this.openTelemetryConsent();
      });
    }

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
    // Otherwise the question is still asked after the shell is gone, on top of
    // whatever replaced it.
    if (this.consentPrompt !== null) clearTimeout(this.consentPrompt);
    this.consentPrompt = null;
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

  openFeedback() {
    // MatDialog stacks whatever it is asked to open, and a double click on the
    // icon asks twice. Two feedback dialogs then fight over one recording: the
    // second holds nothing, and closing it used to throw away what the first
    // was still deciding about.
    if (this.feedbackDialog) return;

    this.feedbackDialog = this.dialog.open(FeedbackDialogComponent);
    this.subscriptions.add(
      this.feedbackDialog.afterClosed().subscribe(() => {
        this.feedbackDialog = null;
      }),
    );
  }

  openTelemetryConsent() {
    this.dialog
      .open(TelemetryConsentDialogComponent)
      .afterClosed()
      .subscribe((level) => {
        // undefined means the dialog was dismissed, which is not an answer.
        if (level !== undefined) {
          this.telemetryConsent.set(level);
        }
      });
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
