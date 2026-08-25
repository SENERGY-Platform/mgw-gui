import {Component} from '@angular/core';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {HostApplicationsComponent} from './host-applications/host-applications.component';
import {HostNetItfBlacklistComponent} from './host-net-itf-blacklist/host-net-itf-blacklist.component';
import {HostNetRngBlacklistComponent} from './host-net-rng-blacklist/host-net-rng-blacklist.component';
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-configuration',
  imports: [
    HostApplicationsComponent,
    HostNetItfBlacklistComponent,
    HostNetRngBlacklistComponent,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
  providers: [provideTranslocoScope('system')],
})
export class ConfigurationComponent {}
