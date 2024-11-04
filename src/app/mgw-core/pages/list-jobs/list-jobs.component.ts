import { Component } from '@angular/core';
import { ListJobTable } from '../../../core/components/list-jobs/list.component';

@Component({
    selector: 'app-list-jobs',
    templateUrl: './list-jobs.component.html',
    styleUrls: ['./list-jobs.component.css'],
    standalone: true,
    imports: [ListJobTable]
})
export class ListJobsComponent {

}
