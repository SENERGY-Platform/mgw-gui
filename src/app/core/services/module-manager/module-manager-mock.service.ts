import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AddModule, Module } from '../../../modules/models/module_models';
import { Deployment, DeploymentRequest, DeploymentTemplate } from 'src/app/deployments/models/deployment_models';
import { ErrorService } from '../util/error.service';
import { JobResponse } from '../../models/module.models';


const TEMPLATE = {
   "host_resources":{
      "bluetooth":{
         "name":"Bluetooth Adapter",
         "description":"Select adapter connected to gateway",
         "group":"G1",
         "tags":[
            "HR Tag"
         ],
         "required":false,
         "value": "bluetooth"
      },
      "zigbee":{
       "name":"Zigbee Adapter",
       "description":"Select adapter connected to gateway",
       "group":"G1",
       "tags":[
          "HR Tag"
       ],
       "required":true,
       "value": "Zigbee"
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
         "type":"certificate",
         "value": "cert"
      }, 
      "login":{
       "name":"Login",
       "description":"Login Credentials",
       "group":"G1",
       "tags":[
          "Sec Tag"
       ],
       "required":false,
       "type":"basic-auth",
       "value": "login"
    }
   },
   "configs":{
      "c1":{
       "name":"Port",
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
       "is_list":false,
       "value": "localhost"
    },
    "c2":{
       "name":"Hosts",
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
       "is_list":true,
       "value": ["user1", "user2"]
    },
    "c3":{
       "name":"Names",
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
       "is_list":true,
       "value": ["user1", "user2"]
    },
    "c4":{
       "name":"Number of instances",
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
       "is_list":false,
       "value": 2
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
       "is_list":false,
       "value": 0.5
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
               "type":"certificate",
               "value": "cert"
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

@Injectable({
  providedIn: 'root'
})
export class ModuleManagerMockService {
  constructor(
    private http: ApiService,
    private errorService: ErrorService
  ) { }  
  
  public deployModule(deploymentRequest: DeploymentRequest): Observable<JobResponse> {
    return new Observable(obs => {
       obs.next({"job_id": "id"})
    })
  }  

  public loadModule(_: Module): Observable<Module> {
   return new Observable(obs => {
      obs.next({
         "id": "id",
         "name": "module 1",
         "description": "bla",
         "version": "v.1.0",
         "author": "Author",
         "deployment_type": "single",
         "licence": "Licence",
         "tags": ["tag1", "tag2", "tag3"],
         "type": "type"
      })
   })
 } 

  public loadDeploymentTemplate(module_id: string): Observable<DeploymentTemplate>  {
    return new Observable((subscriber) => {
      subscriber.next(TEMPLATE)
      subscriber.complete()
    })
  }

  public loadModules(): Observable<Module[]> {
    return new Observable((subscriber) => {
      subscriber.next([
         {
            "id": "id",
            "name": "module 1",
            "description": "bla",
            "version": "v.1.0",
            "author": "Author",
            "deployment_type": "single",
            "licence": "Licence",
            "tags": [],
            "type": "type"
         }, {
            "id": "id2",
            "name": "module 2",
            "description": "bla",
            "version": "v.1.0",
            "author": "Author",
            "deployment_type": "single",
            "licence": "Licence",
            "tags": [],
            "type": "type"
         }
      ])
      subscriber.complete()
   })
  } 
  
  public loadDeployments(): Observable<Deployment[]> {
    return new Observable((subscriber) => {
      var template = [
         {
            "module_id": "modID", 
            "name": "Deployment1", 
            "stopped": true, 
            "id": "id", 
            'indirect': true, 
            'created': new Date(), 
            'updated': new Date(),
            'secrets': {},
            'host_resources': {},
            'configs': {},
            'dep_requiring': [],
            'required_dep': []
         }, 
         {
            "id": "id", 
            "module_id": 
            "id", 
            'indirect': true, 
            'created': new Date(), 
            'updated': new Date(), 
            "name": "Deployment2", 
            "stopped": false,
            'secrets': {},
            'host_resources': {},
            'configs': {},
            'dep_requiring': [],
            'required_dep': []
      }]
      subscriber.next(template)
      subscriber.complete()
    })
  }  

  public loadDeployment(deploymentID: string): Observable<Deployment> {   
   return new Observable((subscriber) => {
      var template = {
         "module_id": "modID", 
         "name": "Deployment1", 
         "stopped": true, 
         "id": "id", 
         'indirect': true, 
         'created': new Date(), 
         'updated': new Date(),
         'secrets': {"cert": "cert", "login": "login"},
         'host_resources': {"zigbee": "value", "bluetooth": "b2"},
         'configs': {"c1": "test", "c2": ["test1", "test2"], "c3": ["test3", "test4"], "c4": 1, "c5": 4},
         'dep_requiring': [],
         'required_dep': []
      }
      subscriber.next(template)
      subscriber.complete()
    })
  }

  public loadDeploymentUpdateTemplate(module_id: string): Observable<DeploymentTemplate> {
      return new Observable((subscriber) => {
         subscriber.next(TEMPLATE)
         subscriber.complete()
       })
  }

  public controlDeployment(deploymentID: string, action: string, changeDependencies: boolean): Observable<unknown | JobResponse> {
   return new Observable(obs => {
         obs.next({"job_id": "id"})
      })
   }

   addModule(module: AddModule): Observable<any> {
      return new Observable(obs => {
         obs.next({"job_id": "id"})
      })
   }

  getJobStatus(jobID: string): Observable<unknown | JobResponse> {
      return new Observable(obs => {
         obs.next({"job_id": "id"})
      })
   }

   deleteModule(_: string): Observable<any> {
      return new Observable(obs => {
         obs.next(true)
      })
   }
}