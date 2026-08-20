import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {RouterModule, Routes} from '@angular/router';
import {ModulesComponent} from './pages/add/modules.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {ShowModuleComponentComponent} from './pages/edit/show-module-component.component';
import {JobLoaderModalComponent} from '../core/components/job-loader-modal/job-loader-modal.component';
import {MatCardModule} from '@angular/material/card';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ListEndpointsComponent} from './pages/list-endpoints/list-endpoints.component';
import {AddEndpointComponent} from './pages/add-endpoint/add-endpoint.component';
import {MatTabsModule} from '@angular/material/tabs';

const routes: Routes = [
  {
    path: 'deployments',
    children: [
      {path: 'add/:id', component: ModulesComponent},
      {path: 'edit/:ids', component: ShowModuleComponentComponent}
    ]
  },
  {
    path: 'resources/endpoints',
    children: [
      {path: '', component: ListEndpointsComponent},
      {path: 'add/:id', component: AddEndpointComponent}
    ]
  }
];

@NgModule({
  imports: [
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatCardModule,
    MatTableModule,
    CommonModule,
    RouterModule.forChild(routes),
    MatChipsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSortModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    MatTabsModule,
    ReactiveFormsModule,
    ModulesComponent,
    ShowModuleComponentComponent,
    JobLoaderModalComponent,
    ListEndpointsComponent,
    AddEndpointComponent
  ],
  exports: []
})
export class DeploymentsModule {
}
