import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

@Component({
    selector: 'dialog-overview-example-dialog',
    templateUrl: 'change-dependencies-dialog.html',
    styleUrls: ['change-dependencies-dialog.css']
})

export class ChangeDependenciesDialog {
    status_change: string 
    changeDependecy: boolean = false

    constructor(
      public dialogRef: MatDialogRef<ChangeDependenciesDialog>,
      @Inject(MAT_DIALOG_DATA) data: any,
    ) {
      this.status_change = data.status_change
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    apply() {
      this.dialogRef.close({"changeDependency": this.changeDependecy})
    }

    cancel() {
      this.dialogRef.close()
    }
}