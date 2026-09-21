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

import {SimpleChange} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import type {Mock} from 'vitest';
import {SecretManagerServiceService} from 'src/app/core/services/secret-manager/secret-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Secret, SecretTypes} from '../../models/secret_models';
import {FormComponent} from './form.component';

// The secret manager returns a secret without its value, so an update carries
// whatever the value fields hold - an empty one wipes the stored value. The
// component is built directly; nothing here touches the template.
function editing(type: SecretTypes): {component: FormComponent; update: Mock} {
  const secret = {id: 'abc', name: 'Broker Key', type, value: ''} as Secret;
  const update = vi.fn().mockReturnValue(of(null));
  const service = {
    getSecret: () => of(secret),
    updateSecret: update,
  } as unknown as SecretManagerServiceService;

  const component = new FormComponent(
    new FormBuilder(),
    service,
    {handleError: vi.fn()} as unknown as ErrorService,
    {navigate: () => Promise.resolve(true)} as unknown as Router,
  );
  component.mode = 'edit';
  component.ngOnChanges({secretID: new SimpleChange(undefined, 'abc', true)});
  return {component, update};
}

describe('FormComponent editing a secret', () => {
  it('refuses to save before the value is entered again', () => {
    const {component, update} = editing(SecretTypes.APIKey);

    expect(component.form.get('name').value).toBe('Broker Key');
    expect(component.form.valid).toBe(false);

    component.updateSecret();
    expect(update).not.toHaveBeenCalled();
  });

  it('sends the entered value once it is filled in', () => {
    const {component, update} = editing(SecretTypes.APIKey);

    component.form.get('value').setValue('new-key');
    expect(component.form.valid).toBe(true);

    component.updateSecret();
    expect(update).toHaveBeenCalledWith({value: 'new-key', name: 'Broker Key', type: SecretTypes.APIKey}, 'abc');
  });

  it('needs both parts of a credential', () => {
    const {component, update} = editing(SecretTypes.BasicAuth);

    component.form.get('username').setValue('admin');
    expect(component.form.valid).toBe(false);

    component.updateSecret();
    expect(update).not.toHaveBeenCalled();

    component.form.get('password').setValue('pw');
    component.updateSecret();
    expect(update).toHaveBeenCalledWith(
      {name: 'Broker Key', type: SecretTypes.BasicAuth, value: '{"username":"admin","password":"pw"}'},
      'abc',
    );
  });
});

describe('FormComponent adding a secret', () => {
  it('refuses to create one without a value', () => {
    const create = vi.fn().mockReturnValue(of(null));
    const component = new FormComponent(
      new FormBuilder(),
      {createSecret: create} as unknown as SecretManagerServiceService,
      {handleError: vi.fn()} as unknown as ErrorService,
      {navigate: () => Promise.resolve(true)} as unknown as Router,
    );
    component.selectedSecretType = SecretTypes.APIKey;
    component.selectSecretType();
    component.form.get('name').setValue('Broker Key');

    expect(component.form.valid).toBe(false);
    component.createSecret();
    expect(create).not.toHaveBeenCalled();

    component.form.get('value').setValue('new-key');
    component.createSecret();
    expect(create).toHaveBeenCalledWith({value: 'new-key', name: 'Broker Key', type: SecretTypes.APIKey});
  });
});
