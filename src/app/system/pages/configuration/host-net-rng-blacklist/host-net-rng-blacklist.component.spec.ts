import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostNetRngBlacklistComponent } from './host-net-rng-blacklist.component';

describe('HostNetRngBlacklistComponent', () => {
  let component: HostNetRngBlacklistComponent;
  let fixture: ComponentFixture<HostNetRngBlacklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostNetRngBlacklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostNetRngBlacklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
