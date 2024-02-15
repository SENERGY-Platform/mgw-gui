import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, of, throwError } from 'rxjs';
import { CoreManagerService } from 'src/app/core/services/core-manager/core-manager.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { CoreEndpointAliasReq } from '../../models/endpoints';

@Component({
  selector: 'app-add-endpoint',
  templateUrl: './add-endpoint.component.html',
  styleUrls: ['./add-endpoint.component.css']
})
export class AddEndpointComponent {
  form = new FormGroup({
    parent_id: new FormControl('', {nonNullable: true, validators: Validators.required}),
    path: new FormControl('', {nonNullable: true, validators: Validators.required}),
  })

  constructor(
    private coreService: CoreManagerService,
    private utilsService: UtilService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.form.controls.parent_id.patchValue(params['id'])
    })
  }

  add() {
    const endpointReq: CoreEndpointAliasReq = {
      parent_id: this.form.controls.parent_id.value,
      path: this.form.controls.path.value
    }
    this.coreService.createEndpointAlias(endpointReq).pipe(
      concatMap((jobID: string) => {
        const message = 'Create endpoint'
        return this.utilsService.checkJobStatus(jobID, message, "core-manager")
      }),
      concatMap(result => {
        if(!result.success) {
          return throwError(() => new Error(result.error))
        }
        return of(true)
      })
    ).subscribe({
      next: (_) => {
        this.router.navigate(["/deployments/endpoints"])
      },
      error: (_) => {
        this.router.navigate(["/deployments/endpoints"])
      }
    })
  }
}
