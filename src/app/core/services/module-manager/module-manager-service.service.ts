import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../modules/module_management/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerServiceService {
  constructor(
    private http: ApiService
  ) { }  
  
  public deployModule(module_id: string, configs: any, secrets: any, resources: any) {
    var path = "/modules" 
    var deploymentRequest = {
      'module_id': module_id,
      "name": "",
      "resources": resources,
      "secrets": secrets,
      "configs": configs

    }
    return this.http.post(path, deploymentRequest);
  }  

  public loadInputTemplate(module_id: string)  {
    //var url = "/modules/" + module_id + '/inputTemplate' 
    //return this.http.get(url);
    return new Observable((subscriber) => {
      var template = {"resources":{"adapter":{"name":"Adapter","description":"Select adapter connected to gateway.","required":true,"group":"res","tags":{"adapter":{},"usb":{}}}},"secrets":{"cert":{"name":"Certificate","description":"Required for encryption.","required":false,"group":"sec","type":"certificate","tags":{"certificate":{}}},"login":{"name":"Login","description":"User credentials.","required":true,"group":"cfg","type":"basic-auth","tags":{}}},"configs":{"c1":{"name":"Config 1","description":"Some text value.","required":true,"group":"cfg","default":null,"options":null,"opt_ext":false,"type":"text","type_opt":{"max_len":15,"min_len":3,"regex":"^[a-zA-Z0-9-_]+$"},"data_type":"string","is_list":false},"c2":{"name":"Config 2","description":"List of text values.","required":false,"group":"cfg","default":["test"],"options":null,"opt_ext":false,"type":"text","type_opt":{"max_len":10,"regex":"^[a-zA-Z0-9]+$"},"data_type":"string","is_list":true},"c3":{"name":"Config 3","description":"The alphabet with duplicates.","required":true,"group":"cfg","default":null,"options":["a","b","c"],"opt_ext":true,"type":"text","type_opt":{"max_len":1,"regex":"^[a-z]+$"},"data_type":"string","is_list":true},"c4":{"name":"Config 4","description":"Select alternative option.","required":false,"group":"cfg","default":1,"options":[1,2,3],"opt_ext":false,"type":"number","type_opt":null,"data_type":"int","is_list":false},"c5":{"name":"Config 5","description":"Select from range.","required":false,"group":"adv","default":null,"options":null,"opt_ext":false,"type":"number","type_opt":{"max":2,"min":1,"step":0.1},"data_type":"float","is_list":false}},"input_groups":{"adv":{"name":"Advanced Settings","description":"Advanced stuff ...","group":null},"cfg":{"name":"Configuration","description":"Change stuff ...","group":null},"res":{"name":"Controller","description":"Select host stuff ...","group":null},"sec":{"name":"Security","description":"Secure stuff ...","group":"adv"}}}
      subscriber.next(template)
      subscriber.complete()
    })
  }

  public loadModuleStati() {
    
  }
  
}