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

@NgModule({
  declarations: [
    SpinnerComponent,
    MainNavigationComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
  ],
  exports: [
    SpinnerComponent,
    MainNavigationComponent
  ]
})
export class CoreModule { }
