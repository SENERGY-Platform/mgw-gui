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
import { ModuleListComponent } from './module-list/module-list.component';
import {MatCardModule} from '@angular/material/card';
import {RouterModule, Routes} from '@angular/router';
import { ModulesComponent } from './input_form/modules.component';
import { CreateCertSecretDialog } from './create-cert-secret-dialog/create-secret-dialog';
import { CreateBasicAuthSecretDialog } from './create-basic-auth-secret-dialog/create-secret-dialog';
import { ModuleManagementComponent } from './module-management.component';

const routes: Routes = [
  {path: 'modules' , component: ModuleManagementComponent, children: [
    {path: 'add', component: ModulesComponent},
    {path: '', component: ModuleListComponent},
  ]},
];

@NgModule({
  declarations: [
    ModuleListComponent,
    ModulesComponent,
    CreateBasicAuthSecretDialog,
    CreateCertSecretDialog,
    ModuleManagementComponent,
  ],
  imports: [
    MatInputModule,
    CommonModule,
    RouterModule.forChild(routes),
    MatChipsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ModuleListComponent,
    ModulesComponent
  ]
})
export class ModuleManagementModule { }
