import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ListJobTable} from './list.component';

describe('ListJobTable', () => {
  let component: ListJobTable;
  let fixture: ComponentFixture<ListJobTable>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListJobTable]
    });
    fixture = TestBed.createComponent(ListJobTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
