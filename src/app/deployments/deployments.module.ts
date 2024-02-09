import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DeploymentListComponent } from './pages/list/deployment-list.component';
import {RouterModule, Routes} from '@angular/router';
import { ModulesComponent } from './pages/add/modules.component';
import { DeploymentTemplate } from './components/single-deployment/deployment-template';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import { CoreModule } from 'src/app/core/core.module';
import { MatSortModule } from '@angular/material/sort';
import { DeploymentComponentComponent } from './components/module-deployment/deployment-component.component';
import { ShowModuleComponentComponent } from './pages/edit/show-module-component.component';
import { JobLoaderModalComponent } from '../core/components/job-loader-modal/job-loader-modal.component';
import { InfoComponent } from './pages/info/info.component';
import {MatCardModule} from '@angular/material/card'; 
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListEndpointsComponent } from './pages/list-endpoints/list-endpoints.component';
import { AddEndpointComponent } from './pages/add-endpoint/add-endpoint.component';
const routes: Routes = [
  {
    path: 'deployments', 
    children: [
      {path: 'add/:id', component: ModulesComponent},
      {path: '', component: DeploymentListComponent},
      {path: 'edit/:id', component: ShowModuleComponentComponent},
      {path: 'info/:id', component: InfoComponent},
      {path: 'endpoints', component: ListEndpointsComponent},
      {path: 'endpoints/add/:id', component: AddEndpointComponent}

    ]
  }
];

@NgModule({
  declarations: [
    DeploymentListComponent,
    ModulesComponent,
    DeploymentTemplate,
    DeploymentComponentComponent,
    ShowModuleComponentComponent,
    JobLoaderModalComponent,
    InfoComponent,
    ListEndpointsComponent,
    AddEndpointComponent
  ],
  imports: [
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    CoreModule,
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
    ReactiveFormsModule
  ],
  exports: [
    DeploymentComponentComponent
  ]
})
export class DeploymentsModule { }
