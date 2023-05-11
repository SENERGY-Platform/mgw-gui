import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowModuleComponentComponent } from './show-module-component.component';

describe('ShowModuleComponentComponent', () => {
  let component: ShowModuleComponentComponent;
  let fixture: ComponentFixture<ShowModuleComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShowModuleComponentComponent]
    });
    fixture = TestBed.createComponent(ShowModuleComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
