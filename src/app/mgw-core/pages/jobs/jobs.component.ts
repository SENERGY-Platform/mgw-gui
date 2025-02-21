import { Component } from '@angular/core';
import {ListJobTable} from "../../../core/components/list-jobs/list.component";

@Component({
  selector: 'app-jobs',
  standalone: true,
    imports: [
        ListJobTable
    ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class JobsComponent {

}
