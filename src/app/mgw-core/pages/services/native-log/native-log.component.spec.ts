import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeLogComponent } from './native-log.component';

describe('NativeLogComponent', () => {
  let component: NativeLogComponent;
  let fixture: ComponentFixture<NativeLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NativeLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NativeLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
