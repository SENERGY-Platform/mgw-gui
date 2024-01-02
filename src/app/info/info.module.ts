import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionComponent } from './version/version.component';
import { Routes, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

const routes: Routes = [
  {
    path: 'info', 
    children: [
      {path: '', component: VersionComponent},
    ]
  }
];

@NgModule({
  declarations: [
    VersionComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule
  ]
})
export class InfoModule { }
