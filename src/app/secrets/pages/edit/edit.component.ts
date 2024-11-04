import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormComponent } from '../../components/form/form.component';

@Component({
    selector: 'app-edit',
    templateUrl: './edit.component.html',
    styleUrls: ['./edit.component.css'],
    standalone: true,
    imports: [FormComponent]
})
export class EditComponent {
  secretID!: string
  
  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    // Override mode to show/edit depending on URL
    this.route.url.subscribe(url => {
      this.secretID = url[1].path
    })
  }
}
