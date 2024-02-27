import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListCoreServicesComponent } from './pages/list-services/list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CoreModule } from '../core/core.module';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ListJobsComponent } from './pages/list-jobs/list-jobs.component';
import { MatCardModule } from '@angular/material/card';
import { ListModuleManagerJobsComponent } from './pages/list-module-manager-jobs/list.component';
import { DurationPipe, VersionComponent } from './pages/list-versions/version.component';
import { ListUsersComponent } from './pages/list-users/list-users.component';
import { RegisterComponent } from './pages/add-account/register.component';
import { EditAccountComponent } from './pages/edit-account/edit-account.component';
import { ListAppsComponent } from './pages/list-apps/list-apps.component';

const routes: Routes = [
  {
    path: 'core', 
    children: [
      {path: 'services', component: ListCoreServicesComponent},
      {path: 'jobs', children: [
        {path: 'core-manager', component: ListJobsComponent},
        {path: 'module-manager', component: ListModuleManagerJobsComponent},
      ]},
      {path: 'info', component: VersionComponent},
      {
        path: 'accounts',
        children: [
          {path: 'add', component: RegisterComponent},
          {path: 'users', children: [
            {path: '', component: ListUsersComponent},
            {path: ':id/edit', component: EditAccountComponent}
          ]},
          {path: 'apps', component: ListAppsComponent}
        ] 
      },
      {path: '', redirectTo: 'info', pathMatch: 'full'}

    ]
  }
];

@NgModule({
  declarations: [
    ListCoreServicesComponent,
    ListJobsComponent,
    VersionComponent,
    ListModuleManagerJobsComponent,
    ListUsersComponent,
    RegisterComponent,
    EditAccountComponent,
    ListAppsComponent,
    DurationPipe
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
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
