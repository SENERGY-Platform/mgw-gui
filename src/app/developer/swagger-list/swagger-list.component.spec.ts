import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';

import {SwaggerListComponent} from './swagger-list.component';

describe('SwaggerListComponent', () => {
  let component: SwaggerListComponent;
  let fixture: ComponentFixture<SwaggerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwaggerListComponent, provideTranslocoTesting('developer')],
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
