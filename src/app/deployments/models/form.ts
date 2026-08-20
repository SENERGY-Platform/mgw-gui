import {ConfigTemplate, HostResourcesTemplate, SecretTemplate} from './deployment_models';

export interface Template {
  secrets: Record<string, SecretTemplate>;
  configs: Record<string, ConfigTemplate>;
  hostResources: Record<string, HostResourcesTemplate>;
}

export type FormTemplate = Record<string, Template>;

export interface Group {
  [id: string]: Group;
}
