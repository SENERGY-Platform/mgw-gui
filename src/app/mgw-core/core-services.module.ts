import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListCoreServicesComponent } from './pages/list-services/list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CoreModule } from '../core/core.module';
import { ListEndpointsComponent } from './pages/list-endpoints/list-endpoints.component';
import { MatButtonModule } from '@angular/material/button';
import { AddEndpointComponent } from './pages/add-endpoint/add-endpoint.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ListJobsComponent } from './pages/list-jobs/list-jobs.component';

const routes: Routes = [
  {
    path: 'core', 
    children: [
      {path: 'services', component: ListCoreServicesComponent},
      {path: 'jobs', component: ListJobsComponent},
      {path: 'endpoints', component: ListEndpointsComponent},
      {path: 'endpoints/add/:id', component: AddEndpointComponent},

    ]
  }
];

@NgModule({
  declarations: [
    ListCoreServicesComponent,
    ListEndpointsComponent,
    AddEndpointComponent,
    ListJobsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    CoreModule,
    MatCheckboxModule,
    MatTableModule,
    RouterModule.forChild(routes),
  ]
})
export class CoreServicesModule { }
