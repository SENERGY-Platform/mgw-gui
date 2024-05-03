import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubDeploymentsComponent } from './sub-deployments.component';

describe('SubDeploymentsComponent', () => {
  let component: SubDeploymentsComponent;
  let fixture: ComponentFixture<SubDeploymentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubDeploymentsComponent]
    });
    fixture = TestBed.createComponent(SubDeploymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
