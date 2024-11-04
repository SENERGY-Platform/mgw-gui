import {ConfigTemplate, HostResourcesTemplate, SecretTemplate} from "./deployment_models"

export interface Template {
  secrets: {
    [id: string]: SecretTemplate
  },
  configs: {
    [id: string]: ConfigTemplate
  },
  hostResources: {
    [id: string]: HostResourcesTemplate
  }
}

export interface FormTemplate {
  [group_id: string]: Template;
}

export interface Group {
  [id: string]: Group;
}
