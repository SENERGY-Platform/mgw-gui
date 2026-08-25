import {Component} from '@angular/core';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {ContainerListComponent} from './container-list/container-list.component';
import {NativeListComponent} from './native-list/native-list.component';
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-services',
  imports: [ContainerListComponent, NativeListComponent, PageHeaderComponent, TranslocoPipe],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
  providers: [provideTranslocoScope('system')],
})
export class ServicesComponent {}
