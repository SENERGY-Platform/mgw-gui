import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DeploymentComponentComponent} from './deployment-component.component';

describe('DeploymentComponentComponent', () => {
  let component: DeploymentComponentComponent;
  let fixture: ComponentFixture<DeploymentComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DeploymentComponentComponent]
    });
    fixture = TestBed.createComponent(DeploymentComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
