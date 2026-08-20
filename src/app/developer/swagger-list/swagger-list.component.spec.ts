import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';

import {SwaggerListComponent} from './swagger-list.component';

describe('SwaggerListComponent', () => {
  let component: SwaggerListComponent;
  let fixture: ComponentFixture<SwaggerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwaggerListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SwaggerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
