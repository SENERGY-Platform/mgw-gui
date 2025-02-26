import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostNetItfBlacklistComponent } from './host-net-itf-blacklist.component';

describe('HostNetItfBlacklistComponent', () => {
  let component: HostNetItfBlacklistComponent;
  let fixture: ComponentFixture<HostNetItfBlacklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostNetItfBlacklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostNetItfBlacklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
