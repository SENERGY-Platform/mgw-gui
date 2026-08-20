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
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';

import {MatSortModule} from '@angular/material/sort';
import {ListComponent} from './pages/list/list.component';
import {InfoComponent} from './pages/info/info.component';
import {MatCardModule} from '@angular/material/card';
import {ManageComponent} from './pages/manage/manage.component';
import {GlobalConfigsComponent} from './pages/global-configs/global-configs.component';
import {RepositoriesComponent} from './pages/repositories/repositories.component';
import {DeploymentsModule} from '../deployments/deployments.module';
import {MatTooltipModule} from '@angular/material/tooltip';

const routes: Routes = [
  {
    path: 'resources/global-configs',
    component: GlobalConfigsComponent,
  },
  {
    path: 'modules',
    children: [
      {path: '', component: ListComponent},
      {path: 'catalog', component: ManageComponent},
      {path: 'repositories', component: RepositoriesComponent},
      {path: 'detail/:id', component: InfoComponent},
      // the detail page used to live under /info
      {path: 'info/:id', redirectTo: 'detail/:id'},
    ],
  },
];

@NgModule({
  imports: [
    MatInputModule,
    MatCheckboxModule,
    DeploymentsModule,
    MatTooltipModule,
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
    FormsModule,
    ReactiveFormsModule,
    ListComponent,
    InfoComponent,
    ManageComponent,
    GlobalConfigsComponent,
    RepositoriesComponent,
  ],
  exports: [],
})
export class ModulesModule {}
