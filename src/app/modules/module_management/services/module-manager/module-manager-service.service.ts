import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/services/api/api.service';
import { Deployment } from '../../models/deployment_models';

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerServiceService {
  constructor(
    private http: ApiService
  ) { }  
  
  public deployModule(module_id: string, configs: any, secrets: any, resources: any, name: string | null | undefined) {
    var path = "/modules" 
    var deploymentRequest = {
      'module_id': module_id,
      "name": name,
      "host_resources": resources,
      "secrets": secrets,
      "configs": configs

    }
    // returns deployment id 
    return this.http.post(path, deploymentRequest);
  }  

  public loadDeploymentTemplate(module_id: string)  {
    //var url = "/modules/" + module_id + '/depTemplate' 
    //return this.http.get(url);
    return new Observable((subscriber) => {
      var template = 
        {
          "module_id":"modID",
          "host_resources":{
             "hr":{
                "name":"Bluetooth Adapter",
                "description":"Select adapter connected to gateway",
                "group":"G1",
                "tags":[
                   "HR Tag"
                ],
                "required":false
             },
             "zigbee":{
              "name":"Zigbee Adapter",
              "description":"Select adapter connected to gateway",
              "group":"G1",
              "tags":[
                 "HR Tag"
              ],
              "required":true
           }
          },
          "secrets":{
             "cert":{
                "name":"Certificate",
                "description":"Required for encryption",
                "group":"G1",
                "tags":[
                   "Sec Tag"
                ],
                "required":true,
                "type":"certificate"
             }, 
             "login":{
              "name":"Login",
              "description":"Login Credentials",
              "group":"G1",
              "tags":[
                 "Sec Tag"
              ],
              "required":false,
              "type":"basic-auth"
           }
          },
          "configs":{
             "c1":{
              "name":"Config 1",
              "description":"Some text value.",
              "required":true,
              "group":"cfg",
              "default":null,
              "options":null,
              "opt_ext":false,
              "type":"text",
              "type_opt":{
                 "max_len":15,
                 "min_len":3,
                 "regex":"^[a-zA-Z0-9-_]+$"
              },
              "data_type":"string",
              "is_list":false
           },
           "c2":{
              "name":"Config 2",
              "description":"List of text values.",
              "required":false,
              "group":"cfg",
              "default":[
                 "test"
              ],
              "options":null,
              "opt_ext":false,
              "type":"text",
              "type_opt":{
                 "max_len":10,
                 "regex":"^[a-zA-Z0-9]+$"
              },
              "data_type":"string",
              "is_list":true
           },
           "c3":{
              "name":"Config 3",
              "description":"The alphabet with duplicates.",
              "required":true,
              "group":"cfg",
              "default":null,
              "options":[
                 "a",
                 "b",
                 "c"
              ],
              "opt_ext":true,
              "type":"text",
              "type_opt":{
                 "max_len":1,
                 "regex":"^[a-z]+$"
              },
              "data_type":"string",
              "is_list":true
           },
           "c4":{
              "name":"Config 4",
              "description":"Select alternative option.",
              "required":false,
              "group":"cfg",
              "default":1,
              "options":[
                 1,
                 2,
                 3
              ],
              "opt_ext":false,
              "type":"number",
              "type_opt":null,
              "data_type":"int",
              "is_list":false
           },
           "c5":{
              "name":"Config 5",
              "description":"Select from range.",
              "required":false,
              "group":"adv",
              "default":null,
              "options":null,
              "opt_ext":false,
              "type":"number",
              "type_opt":{
                 "max":2,
                 "min":1,
                 "step":0.1
              },
              "data_type":"float",
              "is_list":false
           }
          },
          "input_groups":{
             "G1":{
                "name":"Group 1",
                "description":"G1 Desc ..",
                "group":null
             },
             "G2":{
                "name":"Group 2",
                "description":"G2 Desc ..",
                "group":"G1"
             }
          },
          "dependencies":{
             "dep":{
                "host_resources":{
                   "hr":{
                      "name":"HR Input Name",
                      "description":"HR Desc....",
                      "group":"G1",
                      "tags":[
                         "HR Tag"
                      ],
                      "required":false
                   }
                },
                "secrets":{
                   "sec":{
                      "name":"Sec Input Name",
                      "description":"Sec Desc....",
                      "group":"G1",
                      "tags":[
                         "Sec Tag"
                      ],
                      "required":false,
                      "type":"sec type"
                   }
                },
                "configs":{
                   "cfg":{
                      "name":"Cfg Input Name",
                      "description":"Cfg Desc....",
                      "group":"G2",
                      "default": ["a"],
                      "options":[
                         "a",
                         "b"
                      ],
                      "opt_ext":true,
                      "type":"text",
                      "type_opt":null,
                      "data_type":"string",
                      "is_list":true,
                      "required":false
                   }
                },
                "input_groups":{
                   "G1":{
                      "name":"Group 1",
                      "description":"G1 Desc ..",
                      "group":null
                   },
                   "G2":{
                      "name":"Group 2",
                      "description":"G2 Desc ..",
                      "group":"G1"
                   }
                }
             }
          }
       }
      subscriber.next(template)
      subscriber.complete()
    })
  }

  public loadModules() {
    var url = "/modules" 
    return this.http.get(url);
  } 
  
  public loadDeployments(): Observable<Deployment[]> {
    var url = "/deployment" 
    //return <Observable<Deployment[]>>this.http.get<Deployment[]>(url);
    return new Observable((subscriber) => {
      var template = [{"module_id": "id", "name": "Deployment1", "stopped": true, "id": "id"}, {"id": "id", "module_id": "id", "name": "Deployment2", "stopped": false}]
      subscriber.next(template)
      subscriber.complete()
    })
  }  

  public controlDeployments(deploymentID: string, action: string, changeDependencies: boolean) {
    let params = new HttpParams()
    if(changeDependencies) {
      params.set("depD", "true")
    }

    var url = "/deployments" + deploymentID + '/ctrl' 
    var payload = {'cmd': action}
    return this.http.post(url, payload, params);
  }
}