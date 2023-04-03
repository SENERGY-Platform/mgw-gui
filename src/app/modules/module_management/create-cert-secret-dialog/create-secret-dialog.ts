import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { SecretManagerServiceService } from '../services/secret-manager/secret-manager-service.service';
import { FormBuilder, FormControl, ValidatorFn, Validators } from '@angular/forms';

@Component({
    selector: 'dialog-overview-example-dialog',
    templateUrl: 'create-secret-dialog.html',
    styleUrls: ['create-secret-dialog.css']
})

export class CreateCertSecretDialog {
    type: string 
    form = this.formBuilder.group({
      "name": ['', Validators.required],
      "cert": ['', Validators.required],
    })

    constructor(
      public dialogRef: MatDialogRef<CreateCertSecretDialog>,
      @Inject(MAT_DIALOG_DATA) data: any,
      public secretService: SecretManagerServiceService,
      private formBuilder: FormBuilder
    ) {
      this.type = data.type
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    createSecret() {
      this.secretService.createSecret(this.type, this.form.get("name")?.value as string, this.form.get("cert")?.value as string).subscribe((id: any) => {
          this.dialogRef.close({"id": id, "name": this.form.get("name")?.value})
      })
    }
}