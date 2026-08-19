import {TestBed} from '@angular/core/testing';

import {ModuleManagerService} from './module-manager-service.service';

describe('ModuleManagerService', () => {
  let service: ModuleManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModuleManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
