import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ListDeploymentsComponent} from './list-deployments.component';

describe('ListDeploymentsComponent', () => {
  let component: ListDeploymentsComponent;
  let fixture: ComponentFixture<ListDeploymentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListDeploymentsComponent]
    });
    fixture = TestBed.createComponent(ListDeploymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
