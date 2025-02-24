import { Component } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {SwaggerListComponent, Item} from "./swagger-list/swagger-list.component";

const publicBase = location.protocol + "//" + location.host + "/core/api";
const gatewayBase = "http://core-api";
const docBase = "/core/swagger";

@Component({
  selector: 'app-developer',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    SwaggerListComponent,
  ],
  templateUrl: './developer.component.html',
  styleUrl: './developer.component.css'
})
export class DeveloperComponent {
  publicApis: Item[] = [
    {name: "auth-service", apiUrl: publicBase+"/auth-service", docUrl: docBase+"/public/auth-service/index.html"},
    {name: "ce-wrapper", apiUrl: publicBase+"/ce-wrapper", docUrl: docBase+"/public/ce-wrapper/index.html"},
    {name: "core-manager", apiUrl: publicBase+"/core-manager", docUrl: docBase+"/public/core-manager/index.html"},
    {name: "deployment-discovery", apiUrl: location.protocol+"//" +location.host+"/core/discovery", docUrl: docBase+"/public/module-manager/index.html#/Deployment%20Advertisements/get_discovery"},
    {name: "host-manager", apiUrl: publicBase+"/host-manager", docUrl: docBase+"/public/host-manager/index.html"},
    {name: "module-manager", apiUrl: publicBase+"/module-manager", docUrl: docBase+"/public/module-manager/index.html"},
    {name: "secret-manager", apiUrl: publicBase+"/secret-manager", docUrl: docBase+"/public/secret-manager/index.html"},
  ]
  moduleApis: Item[] = [
    {name: "host-manager", apiUrl: gatewayBase+"/host-manager", docUrl: docBase+"/module/host-manager/index.html"},
    {name: "module-manager", apiUrl: gatewayBase+"/module-manager", docUrl: docBase+"/module/module-manager/index.html"},
  ]
  internalApis: Item[] = [
    {name: "ce-wrapper", apiUrl: gatewayBase+"/ce-wrapper", docUrl: docBase+"/internal/ce-wrapper/index.html"},
    {name: "core-manager", apiUrl: gatewayBase+"/c-manager", docUrl: docBase+"/internal/c-manager/index.html"},
    {name: "host-manager", apiUrl: gatewayBase+"/h-manager", docUrl: docBase+"/internal/h-manager/index.html"},
  ]
}
