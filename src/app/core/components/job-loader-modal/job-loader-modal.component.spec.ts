import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobLoaderModalComponent } from './job-loader-modal.component';

describe('JobLoaderModalComponent', () => {
  let component: JobLoaderModalComponent;
  let fixture: ComponentFixture<JobLoaderModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [JobLoaderModalComponent]
});
    fixture = TestBed.createComponent(JobLoaderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
