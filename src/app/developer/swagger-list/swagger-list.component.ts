import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {MatSort, MatSortHeader} from "@angular/material/sort";

export interface Item {
  name: string;
  apiUrl: string;
  docUrl: string;
}

@Component({
  selector: 'app-swagger-list',
  standalone: true,
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    MatHeaderCellDef,
  ],
  templateUrl: './swagger-list.component.html',
  styleUrl: './swagger-list.component.css'
})
export class SwaggerListComponent implements OnInit {
  dataSource = new MatTableDataSource<Item>();
  displayColumns = ['name', 'apiUrl', 'docUrl']
  @Input() items?: Item[];

  ngOnInit(): void {
    console.log(this.items);
    if (this.items) {
      for (let item of this.items) {
        this.dataSource.data.push(item);
      }
      this.dataSource.data = this.dataSource.data;
    }
  }

  goToLink(url: string){
    window.open(url, "_blank");
  }
}
