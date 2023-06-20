import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { SecretManagerServiceService } from '../../../core/services/secret-manager/secret-manager-service.service';
import { FormBuilder, FormControl, ValidatorFn, Validators } from '@angular/forms';

@Component({
    selector: 'dialog-overview-example-dialog',
    templateUrl: 'create-secret-dialog.html',
    styleUrls: ['create-secret-dialog.css']
})

export class CreateBasicAuthSecretDialog {
    type: string 
    form = this.formBuilder.group({
      "name": ['', Validators.required],
      "username": ['', Validators.required],
      "password": ['', Validators.required]
    })

    constructor(
      public dialogRef: MatDialogRef<CreateBasicAuthSecretDialog>,
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
      if(this.form.valid) {
        this.secretService.createSecret(this.type, this.form.get("name")?.value as string, JSON.stringify({"username": this.form.get("username")?.value as string, "password": this.form.get("password")?.value as string})).subscribe((id: any) => {
            this.dialogRef.close({"id": id, "name": this.form.get("name")?.value})
        })
      }
    }

    cancel() {
      this.dialogRef.close()
    }
}