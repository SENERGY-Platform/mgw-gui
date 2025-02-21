import {Component, OnInit, ViewChild} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {concatMap, filter, map, mergeMap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {AuthService} from '../../services/auth/auth.service';
import {ErrorService} from '../../services/util/error.service';
import {SidenavPageModel} from './models/sidenav-page.model';
import {SidenavSectionModel} from './models/sidenav-section.model';
import {NgClass, NgFor, NgIf, UpperCasePipe} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

@Component({
  selector: 'app-main-navigation',
  templateUrl: './main-navigation.component.html',
  styleUrls: ['./main-navigation.component.css'],
  standalone: true,
  imports: [MatSidenavContainer, MatSidenav, NgFor, NgIf, RouterLinkActive, RouterLink, MatIcon, NgClass, MatIconButton, MatMenuTrigger, MatMenu, MatMenuItem, MatSidenavContent, RouterOutlet, UpperCasePipe]
})
export class MainNavigationComponent implements OnInit {
  @ViewChild('sidenav', {static: false}) sidenav!: MatSidenav;
  mode = '';
  openSection: null | string = null;
  sections: SidenavSectionModel[] = [
    new SidenavSectionModel("Deployments", "link", "play_circle_filled", "/deployments", [
      //new SidenavPageModel("Endpoints", 'link', "link", "/deployments/endpoints"),
    ]),
    new SidenavSectionModel("Modules", "link", "extension", "/modules", []),
    new SidenavSectionModel("Secrets", "link", "key", "/secrets", []),
    new SidenavSectionModel("System", "toggle", "dns", "/system", [
      new SidenavPageModel("Status", 'link', "monitor_heart", "/system/status"),
      new SidenavPageModel("Jobs", 'link', "work", "/system/jobs"),
      new SidenavPageModel("Configuration", 'link', "tune", "/system/configuration"),
      new SidenavPageModel("Users", "link", "people", "/system/accounts/users"),
      new SidenavPageModel("Applications", "link", "devices_other", "/system/accounts/apps"),
    ]),
    new SidenavSectionModel("Developer", 'link', "code", "/developer", []),
  ]

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService
  ) {
  }

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
        window.location.href = environment.uiBaseUrl + '/login';
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
