import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListEndpointsComponent } from './pages/list-endpoints/list-endpoints.component';
import { AddEndpointComponent } from './pages/add-endpoint/add-endpoint.component';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from '../core/core.module';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: 'endpoints', 
    children: [
      {path: '', component: ListEndpointsComponent},
      {path: 'add/:id', component: AddEndpointComponent},
    ]
  }
];

@NgModule({
  declarations: [
    ListEndpointsComponent,
    AddEndpointComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreModule,
    MatCardModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EndpointsModule { }
