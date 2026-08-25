import {Component} from '@angular/core';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {ListJobTable} from '../../../core/components/list-jobs/list.component';
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-jobs',
  imports: [ListJobTable, PageHeaderComponent, TranslocoPipe],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css',
  providers: [provideTranslocoScope('system')],
})
export class JobsComponent {}
