import { Component } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {HostApplicationsComponent} from "./host-applications/host-applications.component";
import {HostNetItfBlacklistComponent} from "./host-net-itf-blacklist/host-net-itf-blacklist.component";
import {HostNetRngBlacklistComponent} from "./host-net-rng-blacklist/host-net-rng-blacklist.component";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    HostApplicationsComponent,
    HostNetItfBlacklistComponent,
    HostNetRngBlacklistComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatDivider
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css'
})
export class ConfigurationComponent {

}
