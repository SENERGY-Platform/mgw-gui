import { Component } from '@angular/core';
import {ListJobTable} from "../../../core/components/list-jobs/list.component";
import {PageHeaderComponent} from '../../../core/components/page-header/page-header.component';

@Component({
    selector: 'app-jobs',
    imports: [
        ListJobTable,
        PageHeaderComponent
    ],
    templateUrl: './jobs.component.html',
    styleUrl: './jobs.component.css'
})
export class JobsComponent {

}
