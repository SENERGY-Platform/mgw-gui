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

// Models of the next-gen module-manager job API.
// Mirrors mgw-module-manager/lib/models (jobs.go, results.go, modules.go,
// deployments.go, aux_deployments.go, repositories.go); field names follow
// the JSON tags of the Go structs.

// Zero value of Go time.Time, sent while a job is still running.
const GO_ZERO_TIME_PREFIX = '0001-01-01T00:00:00';

export interface Job {
  id: string;
  description: string;
  start: string;
  // zero value as long as the job is running or was canceled before completion
  end: string;
}

// A job is completed once "end" is set; the outcome must then be retrieved
// from the result endpoint of the respective operation.
export function isJobDone(job: Job): boolean {
  return !!job.end && !job.end.startsWith(GO_ZERO_TIME_PREFIX);
}

export interface ErrorResult {
  // must be checked before relying on the enclosing model
  has_error: boolean;
  error_msg: string;
}

// Embedded in all job results; error_msg is only set if the job was aborted,
// individual item errors are reported by the results of the embedding model.
export interface JobResult extends ErrorResult {
  job_id: string;
}

export interface ChangeReportItem {
  id: string;
  // executed action, values: install, change, remove
  action: string;
}

export interface ChangeReportErrItem extends ChangeReportItem {
  error: string;
}

export interface ModulesChangeJobResult extends JobResult {
  success: ChangeReportItem[];
  // failed modules; the remaining actions of the change request are still executed
  failed: ChangeReportErrItem[];
}

export interface DeploymentResult extends ErrorResult {
  module_id: string;
  // ID of the deployment, empty if the operation failed before it was created
  id: string;
}

export interface DeploymentJobResult extends JobResult {
  results: DeploymentResult[];
  results_err_num: number;
}

export interface AuxiliaryDeploymentBatchResult extends ErrorResult {
  id: string;
}

export interface AuxiliaryDeploymentVolumeResult extends ErrorResult {
  reference: string;
}

export interface AuxiliaryDeploymentRecreateResult extends ErrorResult {
  results: AuxiliaryDeploymentBatchResult[];
  results_err_num: number;
}

export interface AuxiliaryDeploymentDeleteResult extends ErrorResult {
  results: AuxiliaryDeploymentBatchResult[];
  results_err_num: number;
  volume_results: AuxiliaryDeploymentVolumeResult[];
  volume_results_err_num: number;
}

export interface DeploymentUpdateResult extends DeploymentResult {
  auxiliary_deployments: AuxiliaryDeploymentRecreateResult;
}

export interface DeploymentUpdateJobResult extends JobResult {
  results: DeploymentUpdateResult[];
  results_err_num: number;
}

export interface DeploymentDeleteResult extends DeploymentResult {
  auxiliary_deployments: AuxiliaryDeploymentDeleteResult;
}

export interface DeploymentDeleteJobResult extends JobResult {
  results: DeploymentDeleteResult[];
  results_err_num: number;
}

export interface RepositoryChannelErrorResult extends ErrorResult {
  channel: string;
}

export interface RepositoryResult extends ErrorResult {
  // type of the repository, values: github.com, host-dir
  type: string;
  source: string;
  // true if the repository was refreshed, false if it did not match the filter
  refresh: boolean;
  channel_errors: RepositoryChannelErrorResult[];
}

export interface RepositoryJobResult extends JobResult {
  results: RepositoryResult[];
  results_err_num: number;
}
