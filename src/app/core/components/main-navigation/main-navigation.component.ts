import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { concatMap, filter, map, mergeMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth/auth.service';
import { ErrorService } from '../../services/util/error.service';
import { SidenavPageModel } from './models/sidenav-page.model';
import { SidenavSectionModel } from './models/sidenav-section.model';

@Component({
  selector: 'app-main-navigation',
  templateUrl: './main-navigation.component.html',
  styleUrls: ['./main-navigation.component.css']
})
export class MainNavigationComponent implements OnInit {
  @ViewChild('sidenav', { static: false }) sidenav!: MatSidenav;
  mode = '';
  openSection: null | string = null;
  sections: SidenavSectionModel[] = [
    new SidenavSectionModel("Deployments", "link", "play_circle_filled", "/deployments", [
      //new SidenavPageModel("Endpoints", 'link', "link", "/deployments/endpoints"),
    ]),
    new SidenavSectionModel("Modules", "link", "apps", "/modules", []),
    new SidenavSectionModel("Secrets", "link", "key", "/settings/secrets", []),
    new SidenavSectionModel("Core", "toggle", "hub", "/core", [
      new SidenavPageModel("Services", 'link', "computer", "/core/services"),
      new SidenavPageModel("Core-Manager", 'link', "history", "/core/jobs/core-manager"),
      new SidenavPageModel("Module-Manager", "link", "history", "/core/jobs/module-manager"),
      new SidenavPageModel("Users", "link", "person", "/core/accounts/users"),
      new SidenavPageModel("Applications", "link", "person", "/core/accounts/apps"),
    ])
  ]

  constructor(   
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getActiveSection();
  }

  logout() {
    this.authService.initLogout().pipe(
      concatMap((logoutInit) => {
        return this.authService.logout(logoutInit.logout_token);
      })
    ).subscribe({
      next: (_) => {
        window.location.href=environment.uiBaseUrl + '/login';
      },
      error: (err) => {
        this.errorService.handleError("MainNavigationComponent", "logout", err);
      }
    })
  }

  isSectionOpen(section: SidenavSectionModel): boolean {
    if (this.openSection === null) {
        return false;
    } else {
        return this.openSection === section.state;
    }
  }

  toggleSection(section: SidenavSectionModel): void {
      this.openSection = this.openSection === section.state ? null : section.state;
  }

  private getActiveSection() {
    this.router.events
        .pipe(
            filter((event) => event instanceof NavigationEnd),
            map(() => this.activatedRoute.firstChild),
            mergeMap((activatedRoute: any) => activatedRoute.url),
        )
        .subscribe((activeRoute: any) => (this.openSection = '/' + activeRoute[0].path));
  }
}
