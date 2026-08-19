import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ListParentDeploymentsComponent} from './list-deployments.component';

describe('ListParentDeploymentsComponent', () => {
  let component: ListParentDeploymentsComponent;
  let fixture: ComponentFixture<ListParentDeploymentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListParentDeploymentsComponent]
    });
    fixture = TestBed.createComponent(ListParentDeploymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
