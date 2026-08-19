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

// Models of the next-gen auxiliary deployment API (read surface).
// Auxiliary deployments are extra containers a running module spawns; the
// management API only reads them - all write operations live under
// /restricted and are reserved for the modules themselves.
// Mirrors mgw-module-manager/lib/models/aux_deployments.go and deployments.go.

export interface AuxContainer {
  name: string;
  // network alias under which the container is reachable within the deployment
  alias: string;
  image_id: string;
  // values: initialized, running, paused, restarting, removing, stopped, dead
  state: string;
  // values: healthy, unhealthy, transitioning, empty without a health check
  health: string;
}

export interface AuxDeployment {
  id: string;
  deployment_id: string;
  // reference of the module auxiliary service this is based on
  reference: string;
  name: string;
  image: string;
  created: string;
  updated: string;
  enabled: boolean;
  // recreated when the owning deployment is updated
  recreate: boolean;
  labels: Record<string, string> | null;
  configs: Record<string, string> | null;
  volumes: Record<string, string> | null;
  container: AuxContainer;
}
