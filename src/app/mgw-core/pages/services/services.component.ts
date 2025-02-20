import { Component } from '@angular/core';
import {ContainerListComponent} from "./container-list/container-list.component";
import {NativeListComponent} from "./native-list/native-list.component";

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ContainerListComponent, NativeListComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {

}
