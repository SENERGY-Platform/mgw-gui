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
import { ModuleListComponent } from './deployment-list/module-list.component';
import {RouterModule, Routes} from '@angular/router';
import { ModulesComponent } from './add-deployment/modules.component';
import { CreateCertSecretDialog } from './components/create-cert-secret-dialog/create-secret-dialog';
import { CreateBasicAuthSecretDialog } from './components/create-basic-auth-secret-dialog/create-secret-dialog';
import { ModuleManagementComponent } from './module-management.component';
import { DeploymentTemplate } from './components/deployment-template/deployment-template';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ChangeDependenciesDialog } from './deployment-list/components/change-dependencies-dialog/change-dependencies-dialog';
import {MatTableModule} from '@angular/material/table';
import { CoreModule } from 'src/app/core/core.module';
import { MatSortModule } from '@angular/material/sort';
import { DeploymentComponentComponent } from './components/deployment-component/deployment-component.component';
import { ShowModuleComponentComponent } from './show-module-component/show-module-component.component';

const routes: Routes = [
  {path: 'deployments' , component: ModuleManagementComponent, children: [
    {path: 'add', component: ModulesComponent},
    {path: '', component: ModuleListComponent},
    {path: 'edit/:id', component: ShowModuleComponentComponent},
    {path: 'show/:id', component: ShowModuleComponentComponent}
  ]},
];

@NgModule({
  declarations: [
    ModuleListComponent,
    ModulesComponent,
    DeploymentTemplate,
    CreateBasicAuthSecretDialog,
    CreateCertSecretDialog,
    ModuleManagementComponent,
    ChangeDependenciesDialog,
    DeploymentComponentComponent,
    ShowModuleComponentComponent
  ],
  imports: [
    MatInputModule,
    MatCheckboxModule,
    CoreModule,
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
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    
  ]
})
export class ModuleManagementModule { }
