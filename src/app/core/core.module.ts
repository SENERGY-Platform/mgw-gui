import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { SpinnerComponent } from './components/spinner/spinner.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MainNavigationComponent } from './components/main-navigation/main-navigation.component';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { ListJobTable } from './components/list-jobs/list.component';
import { MatTableModule } from '@angular/material/table';
import { ListEndpointsComponent } from './components/list-endpoints/list-endpoints.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';

@NgModule({
  declarations: [
    SpinnerComponent,
    MainNavigationComponent,
    ConfirmDialogComponent,
    ListJobTable,
    ListEndpointsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatToolbarModule,
    MatMenuModule,
    MatSortModule
  ],
  exports: [
    SpinnerComponent,
    MainNavigationComponent,
    ListJobTable,
    ListEndpointsComponent
  ]
})
export class CoreModule { }
