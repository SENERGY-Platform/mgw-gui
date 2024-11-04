import {TestBed} from '@angular/core/testing';

import {SecretManagerServiceService} from './secret-manager-service.service';

describe('SecretManagerServiceService', () => {
  let service: SecretManagerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecretManagerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
