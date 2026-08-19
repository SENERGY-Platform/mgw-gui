import {TestBed} from '@angular/core/testing';

import {AuthCheckInterceptor} from './auth.interceptor';

describe('AuthCheckInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      AuthCheckInterceptor
    ]
  }));

  it('should be created', () => {
    const interceptor: AuthCheckInterceptor = TestBed.inject(AuthCheckInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
