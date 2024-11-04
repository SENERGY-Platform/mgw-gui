import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoSubDeploymentComponent } from './info-sub-deployment.component';

describe('InfoSubDeploymentComponent', () => {
  let component: InfoSubDeploymentComponent;
  let fixture: ComponentFixture<InfoSubDeploymentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [InfoSubDeploymentComponent]
});
    fixture = TestBed.createComponent(InfoSubDeploymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
