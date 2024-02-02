import { TestBed } from '@angular/core/testing';

import { CoreManagerService } from './core-manager.service';

describe('CoreManagerService', () => {
  let service: CoreManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoreManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
