import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormComponent} from '../../components/form/form.component';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  imports: [FormComponent],
})
export class EditComponent implements OnInit {
  secretID!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe((url) => {
      this.secretID = url[1].path;
    });
  }
}
