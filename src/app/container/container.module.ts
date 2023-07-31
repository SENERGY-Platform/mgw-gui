import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './pages/list/list.component';
import { CoreModule } from '../core/core.module';
import { RouterModule, Routes } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LogsComponent } from './pages/logs/logs.component';
import { HighlightModule } from 'ngx-highlightjs';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: 'deployments', 
    children: [
      {path: 'show/:id', component: ListComponent},
      {path: 'containers/:id/logs', component: LogsComponent},
    ]
  }
];

@NgModule({
  declarations: [
    ListComponent,
    LogsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    HighlightModule,
    RouterModule.forChild(routes),
    CoreModule
  ]
})
export class ContainerModule { }
