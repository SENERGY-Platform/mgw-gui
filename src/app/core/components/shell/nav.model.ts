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
  {label: 'Overview', icon: 'dashboard', route: '/overview', exact: true},
  {
    label: 'Modules',
    icon: 'extension',
    route: '/modules',
    children: [
      {label: 'Installed', icon: 'inventory_2', route: '/modules', exact: true},
      {label: 'Catalog', icon: 'storefront', route: '/modules/catalog', exact: true},
      {label: 'Repositories', icon: 'cloud_download', route: '/modules/repositories', exact: true},
    ],
  },
  {
    label: 'Resources',
    icon: 'category',
    route: '/resources',
    children: [
      {label: 'Secrets', icon: 'key', route: '/resources/secrets', exact: true},
      {label: 'Global configs', icon: 'tune', route: '/resources/global-configs', exact: true},
      {label: 'Endpoints', icon: 'link', route: '/resources/endpoints', exact: true},
    ],
  },
  {
    label: 'System',
    icon: 'dns',
    route: '/system',
    children: [
      {label: 'Status', icon: 'monitor_heart', route: '/system/status', exact: true},
      {label: 'Jobs', icon: 'work_history', route: '/system/jobs', exact: true},
      {label: 'Configuration', icon: 'settings', route: '/system/configuration', exact: true},
      {label: 'Users', icon: 'group', route: '/system/accounts/users', exact: true},
      {label: 'Applications', icon: 'devices_other', route: '/system/accounts/apps', exact: true},
    ],
  },
  {label: 'Developer', icon: 'code', route: '/developer', exact: true},
];
