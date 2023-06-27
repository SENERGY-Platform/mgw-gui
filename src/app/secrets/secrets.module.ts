import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './pages/list/list.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path: 'secrets' , component: ListComponent, children: [
    {path: '', component: ListComponent}
  ]},
];

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class SecretsModule { }
