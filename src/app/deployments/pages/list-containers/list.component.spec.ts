import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ListContainersComponent} from './list.component';

describe('ListContainersComponent', () => {
  let component: ListContainersComponent;
  let fixture: ComponentFixture<ListContainersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListContainersComponent]
    });
    fixture = TestBed.createComponent(ListContainersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
