import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAppsComponent } from './list-apps.component';

describe('ListAppsComponent', () => {
  let component: ListAppsComponent;
  let fixture: ComponentFixture<ListAppsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ListAppsComponent]
});
    fixture = TestBed.createComponent(ListAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
