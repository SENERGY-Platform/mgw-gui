import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListJobTable } from './list.component';

describe('ListJobTable', () => {
  let component: ListJobTable;
  let fixture: ComponentFixture<ListJobTable>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListJobTable]
    });
    fixture = TestBed.createComponent(ListJobTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
