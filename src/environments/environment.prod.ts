import { ContainerEngineManagerService } from "src/app/core/services/container-engine-manager/container-engine-manager.service";
import { HostManagerService } from "src/app/core/services/host-manager/host-manager.service";
import { SecretManagerServiceService } from "src/app/core/services/secret-manager/secret-manager-service.service";
import { ModuleManagerService } from "../app/core/services/module-manager/module-manager-service.service";

export const environment = {
    production: true,
    moduleManagerService: ModuleManagerService,
    secretManagerService: SecretManagerServiceService,
    hostManagerService: HostManagerService,
    containerEngineManagerService: ContainerEngineManagerService,
    uiVersion: "UI-VERSION"
};