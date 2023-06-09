import { Component, Inject, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { CreateSecret, SecretType, SecretTypes } from '../../models/secret_models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent {

  constructor() {}
}
