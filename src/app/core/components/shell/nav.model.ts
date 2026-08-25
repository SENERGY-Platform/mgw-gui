/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface NavItem {
  /** A translation key, not display text - shell.component.html applies the `transloco` pipe to it. */
  label: string;
  icon: string;
  route: string;
  // only the parent route of a section is matched loosely, leaves match exactly
  exact?: boolean;
  children?: NavItem[];
}

/**
 * The navigation is organised by what the user manages, not by which backend
 * service owns it: modules and their deployments first, the things a
 * deployment consumes second, the gateway itself last.
 */
export const NAV_ITEMS: NavItem[] = [
  {label: 'core.nav.overview', icon: 'dashboard', route: '/overview', exact: true},
  {
    label: 'core.nav.modules',
    icon: 'extension',
    route: '/modules',
    children: [
      {label: 'core.nav.modulesInstalled', icon: 'inventory_2', route: '/modules', exact: true},
      {label: 'core.nav.modulesCatalog', icon: 'storefront', route: '/modules/catalog', exact: true},
      {label: 'core.nav.modulesRepositories', icon: 'cloud_download', route: '/modules/repositories', exact: true},
    ],
  },
  {
    label: 'core.nav.resources',
    icon: 'category',
    route: '/resources',
    children: [
      {label: 'core.nav.resourcesSecrets', icon: 'key', route: '/resources/secrets', exact: true},
      {label: 'core.nav.resourcesGlobalConfigs', icon: 'tune', route: '/resources/global-configs', exact: true},
      {label: 'core.nav.resourcesEndpoints', icon: 'link', route: '/resources/endpoints', exact: true},
    ],
  },
  {
    label: 'core.nav.system',
    icon: 'dns',
    route: '/system',
    children: [
      {label: 'core.nav.systemStatus', icon: 'monitor_heart', route: '/system/status', exact: true},
      {label: 'core.nav.systemJobs', icon: 'work_history', route: '/system/jobs', exact: true},
      {label: 'core.nav.systemConfiguration', icon: 'settings', route: '/system/configuration', exact: true},
      {label: 'core.nav.systemUsers', icon: 'group', route: '/system/accounts/users', exact: true},
      {label: 'core.nav.systemApplications', icon: 'devices_other', route: '/system/accounts/apps', exact: true},
    ],
  },
  {label: 'core.nav.developer', icon: 'code', route: '/developer', exact: true},
];
