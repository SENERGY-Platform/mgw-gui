import {Component, Inject} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {catchError, map, throwError} from 'rxjs';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {AddModule} from '../../models/module_models';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatButton]
})
export class AddComponent {
  form = this.fb.group({
    "id": this.fb.control("", Validators.required),
    "version": this.fb.control("")
  })

  constructor(
    private fb: FormBuilder,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
    private router: Router,
    public dialog: MatDialog,
    private utilsService: UtilService,
    private errorService: ErrorService,
  ) {
  }

  addModule() {
    this.form.markAllAsTouched()
    if (this.form.valid) {
      var module: AddModule = JSON.parse(JSON.stringify(this.form.value))
      this.moduleService.addModule(module).pipe(
        map(jobID => {
          var message = "Module installation is running"
          this.utilsService.checkJobStatus(jobID, message, "module-manager").subscribe(result => {
            this.navigateToModules()
            if (!result.success) {
              throwError(() => new Error(result.error))
            }
          })
        }),
        catchError(err => this.errorService.handleError(AddComponent.name, "addModule", err))
      ).subscribe()
    }
  }

  cancel() {
    this.navigateToModules()
  }

  navigateToModules() {
    this.router.navigate(["/modules"])
  }
}
