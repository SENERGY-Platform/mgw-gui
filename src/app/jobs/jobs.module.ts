import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list/list.component';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const routes: Routes = [
  {path: 'jobs' , component: ListComponent, children: [
    {path: '', component: ListComponent},
  ]},
];


@NgModule({
  declarations: [
    ListComponent
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
