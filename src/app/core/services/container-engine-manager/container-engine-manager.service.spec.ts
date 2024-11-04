import {TestBed} from '@angular/core/testing';

import {ContainerEngineManagerService} from './container-engine-manager.service';

describe('ContainerEngineManagerService', () => {
  let service: ContainerEngineManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContainerEngineManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
