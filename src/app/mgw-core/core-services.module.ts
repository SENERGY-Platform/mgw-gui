import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListCoreServicesComponent } from './pages/list-services/list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CoreModule } from '../core/core.module';
import { ListEndpointsComponent } from './pages/list-endpoints/list-endpoints.component';

const routes: Routes = [
  {
    path: 'core', 
    children: [
      {path: 'services', component: ListCoreServicesComponent},
      {path: 'endpoints', component: ListEndpointsComponent},
    ]
  }
];

@NgModule({
  declarations: [
    ListCoreServicesComponent,
    ListEndpointsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    CoreModule,
    MatCheckboxModule,
    MatTableModule,
    RouterModule.forChild(routes),
  ]
})
export class CoreServicesModule { }
