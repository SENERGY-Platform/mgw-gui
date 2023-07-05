import { HostManagerService } from "src/app/core/services/host-manager/host-manager.service";
import { ModuleManagerMockService } from "src/app/core/services/module-manager/module-manager-mock.service";
import { SecretManagerServiceService } from "src/app/core/services/secret-manager/secret-manager-service.service";
import { ModuleManagerService } from "../app/core/services/module-manager/module-manager-service.service";

export const environment = {
    production: false,
    moduleManagerService: ModuleManagerMockService,
    secretManagerService: SecretManagerServiceService,
    hostManagerService: HostManagerService
};