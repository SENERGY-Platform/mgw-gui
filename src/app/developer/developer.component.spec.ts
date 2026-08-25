import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {provideTranslocoTesting} from 'src/testing/transloco-testing';

import {DeveloperComponent} from './developer.component';

describe('DeveloperComponent', () => {
  let component: DeveloperComponent;
  let fixture: ComponentFixture<DeveloperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperComponent, provideTranslocoTesting('developer')],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
