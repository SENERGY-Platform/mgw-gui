import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.css'],
    standalone: true,
    imports: [MatButton]
})
export class ConfirmDialogComponent {
  message!: string

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.message = data.message
  }

  cancel() {
    this.dialogRef.close(false)
  }

  confirm() {
    this.dialogRef.close(true)

  }
}

