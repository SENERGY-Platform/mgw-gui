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
import {RouterModule, Routes} from '@angular/router';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import { CoreModule } from 'src/app/core/core.module';
import { MatSortModule } from '@angular/material/sort';
import { ListComponent } from './pages/list/list.component';
import { AddComponent } from './pages/add/add.component';
import { InfoComponent } from './pages/info/info.component';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { MatCardModule } from '@angular/material/card';

const routes: Routes = [
  {path: 'modules', children: [
    {path: 'add', component: AddComponent},
    {path: '', component: ListComponent},
    // TODO edit module {path: 'edit/:id', component: ShowModuleComponentComponent},
    {path: 'show/:id', component: InfoComponent}
  ]},
];

@NgModule({
  declarations: [
    ListComponent,
    AddComponent,
    InfoComponent,
    UpdateModalComponent
  ],
  imports: [
    MatInputModule,
    MatCheckboxModule,
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
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    
  ]
})
export class ModulesModule { }
