import { TestBed } from '@angular/core/testing';

import { HostManagerService } from './host-manager.service';

describe('HostManagerService', () => {
  let service: HostManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
