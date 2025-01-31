import {ComponentFixture, TestBed} from '@angular/core/testing';

import {VersionComponent} from './version.component';

describe('VersionComponent', () => {
  let component: VersionComponent;
  let fixture: ComponentFixture<VersionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VersionComponent]
    });
    fixture = TestBed.createComponent(VersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
