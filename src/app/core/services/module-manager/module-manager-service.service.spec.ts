import { TestBed } from '@angular/core/testing';

import { ModuleManagerServiceService } from './module-manager-service.service';

describe('ModuleManagerServiceService', () => {
  let service: ModuleManagerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModuleManagerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
