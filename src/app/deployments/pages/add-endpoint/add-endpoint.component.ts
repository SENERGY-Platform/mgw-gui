/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {concatMap, of, throwError} from 'rxjs';
import {CoreManagerService} from 'src/app/core/services/core-manager/core-manager.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {CoreEndpointAliasReq} from '../../models/endpoints';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-add-endpoint',
  templateUrl: './add-endpoint.component.html',
  styleUrls: ['./add-endpoint.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatButton,
    RouterLink,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('deployments')],
})
export class AddEndpointComponent {
  // Resolved directly rather than through the `transloco` pipe: the job
  // message below is a plain string handed to a dialog with no template
  // binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);

  form = new FormGroup({
    parent_id: new FormControl('', {nonNullable: true, validators: Validators.required}),
    path: new FormControl('', {nonNullable: true, validators: Validators.required}),
  });

  constructor(
    private coreService: CoreManagerService,
    private utilsService: UtilService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe((params) => {
      this.form.controls.parent_id.patchValue(params['id']);
    });
  }

  add() {
    const endpointReq: CoreEndpointAliasReq = {
      parent_id: this.form.controls.parent_id.value,
      path: this.form.controls.path.value,
    };
    this.coreService
      .createEndpointAlias(endpointReq)
      .pipe(
        concatMap((jobID: string) => {
          const message = this.transloco.translate<string>('deployments.addEndpoint.jobMessage');
          return this.utilsService.checkJobStatus(jobID, message, 'core-manager');
        }),
        concatMap((result) => {
          if (!result.success) {
            return throwError(() => new Error(result.error));
          }
          return of(true);
        }),
      )
      .subscribe({
        next: (_) => {
          this.router.navigate(['/resources/endpoints']);
        },
        error: (_) => {
          this.router.navigate(['/resources/endpoints']);
        },
      });
  }
}
