import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ListComponent} from './pages/list/list.component';
import {RouterModule, Routes} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';

import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {AddComponent} from './pages/add/add.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {TextFieldModule} from '@angular/cdk/text-field';
import {EditComponent} from './pages/edit/edit.component';
import {FormComponent} from './components/form/form.component';

const routes: Routes = [
  {
    path: 'settings/secrets', children: [
      {path: '', component: ListComponent},
      {path: 'add', component: AddComponent},
      {path: 'edit/:id', component: EditComponent}
    ]
  },
];

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    TextFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    RouterModule.forChild(routes),
    ListComponent,
    AddComponent,
    EditComponent,
    FormComponent
  ]
})
export class SecretsModule {
}
