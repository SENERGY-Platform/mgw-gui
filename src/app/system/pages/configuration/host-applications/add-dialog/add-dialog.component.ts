import {Component, OnInit} from '@angular/core';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";

export interface DialogData {
  name: string;
  socket: string;
}

@Component({
  selector: 'app-add-dialog',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatLabel,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatDialogActions,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-dialog.component.html',
  styleUrl: './add-dialog.component.css'
})
export class AddDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    readonly dialogRef: MatDialogRef<AddDialogComponent>
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: [null, Validators.required],
      socket: [null, Validators.required]
    })
  }

  submit(form: { value: DialogData; }) {
    this.dialogRef.close(form.value);
  }
}
