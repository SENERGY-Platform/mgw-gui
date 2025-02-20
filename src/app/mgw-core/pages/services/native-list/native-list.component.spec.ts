import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeListComponent } from './native-list.component';

describe('NativeListComponent', () => {
  let component: NativeListComponent;
  let fixture: ComponentFixture<NativeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NativeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NativeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
