import {Component} from '@angular/core';
import {FormComponent} from '../../components/form/form.component';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
  standalone: true,
  imports: [FormComponent]
})
export class AddComponent {

  constructor() {
  }
}
