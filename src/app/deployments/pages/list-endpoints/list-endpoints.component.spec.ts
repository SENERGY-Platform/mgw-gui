import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ListEndpointsComponent} from './list-endpoints.component';

describe('ListEndpointsComponent', () => {
  let component: ListEndpointsComponent;
  let fixture: ComponentFixture<ListEndpointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListEndpointsComponent]
    });
    fixture = TestBed.createComponent(ListEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
