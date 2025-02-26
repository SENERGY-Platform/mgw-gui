import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostApplicationsComponent } from './host-applications.component';

describe('HostApplicationsComponent', () => {
  let component: HostApplicationsComponent;
  let fixture: ComponentFixture<HostApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
