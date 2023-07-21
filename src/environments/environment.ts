import { ContainerEngineManagerMockService } from "src/app/core/services/container-engine-manager/container-engine-manager-mock.service";
import { HostManagerMockService } from "src/app/core/services/host-manager/host-manager-mock.service";
import { SecretManagerMockService } from "src/app/core/services/secret-manager/secret-manager-mock-service";
import { SecretManagerServiceService } from "src/app/core/services/secret-manager/secret-manager-service.service";
import { ModuleManagerMockService } from "../app/core/services/module-manager/module-manager-mock.service";

export const environment = {
    production: false,
    moduleManagerService: ModuleManagerMockService,
    secretManagerService: SecretManagerMockService,
    hostManagerService: HostManagerMockService,
    containerEngineManagerService: ContainerEngineManagerMockService
};