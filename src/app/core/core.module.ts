import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { SpinnerComponent } from './components/spinner/spinner.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';

@NgModule({
  declarations: [
    SpinnerComponent
  ],
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  exports: [
    SpinnerComponent
  ]
})
export class CoreModule { }
