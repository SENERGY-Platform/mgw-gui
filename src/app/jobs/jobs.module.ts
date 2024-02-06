import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ListJobsComponent } from './list/list.component';

const routes: Routes = [
  {path: 'settings/jobs' , component: ListJobsComponent, children: [
    {path: '', component: ListJobsComponent},
  ]},
];


@NgModule({
  declarations: [
    ListJobsComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    RouterModule.forChild(routes),
  ]
})
export class JobsModule { }
