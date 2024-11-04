import { Component} from '@angular/core';
import { ListJobTable } from '../../../core/components/list-jobs/list.component';
@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    standalone: true,
    imports: [ListJobTable]
})
export class ListModuleManagerJobsComponent {
}
