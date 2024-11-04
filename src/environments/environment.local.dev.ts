import {
  ContainerEngineManagerService
} from "src/app/core/services/container-engine-manager/container-engine-manager.service";
import {CoreManagerService} from "src/app/core/services/core-manager/core-manager.service";
import {HostManagerService} from "src/app/core/services/host-manager/host-manager.service";
import {SecretManagerServiceService} from "src/app/core/services/secret-manager/secret-manager-service.service";
import {ModuleManagerService} from "../app/core/services/module-manager/module-manager-service.service";

const CORE_PREFIX = "http://localhost:8080/core";

export const environment = {
  production: false,
  moduleManagerService: ModuleManagerService,
  secretManagerService: SecretManagerServiceService,
  hostManagerService: HostManagerService,
  containerEngineManagerService: ContainerEngineManagerService,
  coreManagerService: CoreManagerService,
  uiVersion: "UI-VERSION",
  coreApiUrl: CORE_PREFIX + "/api",
  authApiUrl: CORE_PREFIX + "/auth",
  uiBaseUrl: CORE_PREFIX + "/web-ui",
  endpointsUrl: "/endpoints"
};
