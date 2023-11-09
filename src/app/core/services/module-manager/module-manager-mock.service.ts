import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AddModule, Module, ModuleUpdate, ModuleUpdatePrepare, ModuleUpdates } from '../../../modules/models/module_models';
import { Deployment, DeploymentHealth, DeploymentHealths, DeploymentRequest, DeploymentTemplate } from 'src/app/deployments/models/deployment_models';
import { ErrorService } from '../util/error.service';
import { Job } from 'src/app/jobs/models/job.model';
import { delay } from "rxjs/operators";


const TEMPLATE = {
   "name": "deployment",
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
       "default":0,
       "options":[
          0,
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
      "github.com/SENERGY-Platform/mgw-test-module-a":{
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
  
  public deployModule(deploymentRequest: DeploymentRequest): Observable<string> {
    return new Observable(obs => {
       obs.next("id")
    })
  }  

  public loadModule(_: Module): Observable<Module> {
   return new Observable(obs => {
      obs.next({
         "id": "github.com/SENERGY-Platform/mgw-test-module-a",
         "name": "module 1",
         "description": "bla",
         "version": "v.1.0",
         "author": "Author",
         "deployment_type": "single",
         "license": "license",
         "tags": ["tag1", "tag2", "tag3"],
         "type": "type",
         "indirect": false,
         "added": new Date(),
         "updated": new Date()
      })
   })
 } 

  public loadDeploymentTemplate(module_id: string): Observable<DeploymentTemplate>  {
   return of(TEMPLATE).pipe(delay(1000));    
  }
  
  public loadModules(): Observable<Module[]> {
     var modules = [
      {
         "id": "github.com/SENERGY-Platform/mgw-test-module-a",
         "name": "module 1",
         "description": "bla",
         "version": "v.1.0",
         "author": "Author",
         "deployment_type": "single",
         "license": "license",
         "tags": [],
         "type": "type",
         "indirect": false,
         "added": new Date(),
         "updated": new Date()
      }, {
         "id": "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module",
         "name": "module 2",
         "description": "bla",
         "version": "v.1.0",
         "author": "Author",
         "deployment_type": "single",
         "license": "license",
         "tags": [],
         "type": "type",
         "indirect": false,
         "added": new Date(),
         "updated": new Date()
      }
   ]
   return of(modules).pipe(delay(1000));
  } 
  
  checkForUpdates(): Observable<string> {
   return of("job_ID").pipe(delay(200));    
 }

 getAvailableUpdates(): Observable<any> {
  var moduleUpdates: ModuleUpdates = 
   {
      "github.com/SENERGY-Platform/mgw-test-module-a": {
         "versions":["v2.0.15"],"checked": new Date(),"pending":true, "pending_versions": {
            "github.com/SENERGY-Platform/mgw-test-module-a": "v0.2"
         }
      },
      "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": {
         "versions":["v0.1.2","v0.1.3","v0.1.4"],"checked": new Date(),"pending":false, "pending_versions": {
            "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": "v0.2"
         }
      }
   }
  return of(moduleUpdates).pipe(delay(1000));    
 }

 getAvailableModuleUpdates(moduleID: string): Observable<ModuleUpdate> {
   var moduleUpdates: ModuleUpdate = {
         "versions": ["v1", "v2"],
         "checked": new Date(),
         "pending": true, // ready to be updated
         "pending_versions": {
            "github.com/SENERGY-Platform/mgw-test-module-a": "v0.2",
            "github.com/SENERGY-Platform/mgw-test-module-b/mgw-module": "v0.3"
         }
      }
   return of(moduleUpdates).pipe(delay(1000));   
 }

 prepareModuleUpdate(moduleID: string, payload: ModuleUpdatePrepare): Observable<string> {
   return of("job_ID").pipe(delay(1000));    
 }

 getModuleUpdateTemplate(moduleID: string): Observable<DeploymentTemplate> {
   return of(TEMPLATE).pipe(delay(500))
}

cancelModuleUpdate(moduleID: string): Observable<string> {
   return of("done").pipe(delay(1000));    
}

  public loadDeployments(): Observable<Deployment[]> {
     var deployments = [
      {
         "module": {
            "id": "github.com/SENERGY-Platform/mgw-test-module-a",
            "version": ""
         }, 
         "name": "Deployment1", 
         "enabled": true, 
         "id": "id", 
         'indirect': true, 
         'created': new Date(), 
         'updated': new Date(),
         'secrets': {},
         'host_resources': {},
         'configs': {},
         'dep_requiring': [],
         'required_dep': [],
         'instance': {
            "id": "id",
            "created": new Date(),
            "containers": []
         }
      }, 
      {
         "id": "id2", 
         "module": {
            "id": "github.com/SENERGY-Platform/mgw-test-module-a",
            "version": ""
         }, 
         'indirect': true, 
         'created': new Date(), 
         'updated': new Date(), 
         "name": "Deployment2", 
         "enabled": false,
         'secrets': {},
         'host_resources': {},
         'configs': {},
         'dep_requiring': [],
         'required_dep': [],
         'instance': {
            "id": "id",
            "created": new Date(),
            "containers": []
         }
      }]
      return of(deployments).pipe(delay(1000));
  }  

  public loadDeployment(deploymentID: string): Observable<Deployment> {   
   return new Observable((subscriber) => {
      var template = {
         "module": {
            "id": "github.com/SENERGY-Platform/mgw-test-module-a",
            "version": ""
         }, 
         "name": "Deployment1", 
         "enabled": true, 
         "id": "id", 
         'indirect': true, 
         'created': new Date(), 
         'updated': new Date(),
         'secrets': {"cert": {"id": "cert", "variants": []}, "login": {"id": "login", "variants": []}},
         'host_resources': {"zigbee": "value", "bluetooth": "b2"},
         'configs': {
            "c1": {"is_slice": false, "value": "value", "data_type": "string"}, 
            "c2": {"is_slice": true, "value": ["value", "value2"], "data_type": "string"}, 
            "c3": {"is_slice": true, "value": ["value"], "data_type": "string"}, 
            "c4": {"is_slice": false, "value": 1, "data_type": "number"},
            "c5": {"is_slice": false, "value": 2, "data_type": "number"},
         },
         'dep_requiring': [],
         'required_dep': [],
         "instance": {
            "id": "id",
            "created": new Date(),
            "containers": []
         }
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

  public startDeployment(deploymentID: string): Observable<Job> {
   return new Observable(obs => {
         obs.next({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
      })
   }

   public startDeployments(deploymentIDs: string): Observable<Job> {
      return new Observable(obs => {
            obs.next({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
         })
      }

   restartDeployment(deploymentID: string): Observable<any> {
      return of({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
   }

   restartDeployments(deploymentIDs: string): Observable<any> {
      return of({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
   }

   public stopDeployment(deploymentID: string, force: boolean): Observable<Job> {
      return new Observable(obs => {
            obs.next({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
         })
   }

   public stopDeployments(deploymentIDs: string, force: boolean): Observable<Job> {
      return new Observable(obs => {
            obs.next({"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()})
         })
   }

   addModule(module: AddModule): Observable<any> {
      return new Observable(obs => {
         obs.next({"id": "id", "completed": new Date(), "error": ""})
      })
   }

  getJobStatus(jobID: string): Observable<unknown | Job> {
      return new Observable(obs => {
         obs.next({"id": "id", "completed": new Date(), "error": null})
      })
   }

   getJobs(): Observable<Job[]> {
      var jobs = [{"id": "id", "completed": new Date(), "error": null, "created": new Date(), "canceled": new Date(), "description": "Test", "started": new Date()}]
      return of(jobs).pipe(delay(1000));
   }

   deleteModule(_: string): Observable<any> {
      return new Observable(obs => {
         obs.next(true)
      })
   }

   stopJob(jobId: string): Observable<any> {
      return new Observable(obs => {
         obs.next(true)
      })
   }

   deleteDeployment(deploymentID: string, force: boolean): Observable<any> {
      return new Observable(obs => {
         obs.next(true)
      })
   }

   deleteDeployments(deploymentIDs: string, force: boolean): Observable<any> {
      return new Observable(obs => {
         obs.next(true)
      })
   }


   // Health
   getDeploymentsHealth(): Observable<DeploymentHealths> {
     var health = {
        "id": {
           "status": "unknown",
           "containers": [{
              "id": "id2",
              "ref": "Ref",
              "state": "running"
           }]
        }
     }
     return of(health).pipe(delay(500))
   }

   getDeploymentHealth(deploymentID: string): Observable<DeploymentHealth> {
      var health = {
            "status": "unknown",
            "containers": [{
               "id": "id2",
               "ref": "Ref",
               "state": "running"
            }]
      }
      return of(health).pipe(delay(500))
   }
}