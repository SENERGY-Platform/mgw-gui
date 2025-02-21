import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DeveloperComponent} from "./developer/developer.component";

const routes: Routes = [
  {path: '', redirectTo: '/deployments', pathMatch: 'full'},
  {path: 'developer', component: DeveloperComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
