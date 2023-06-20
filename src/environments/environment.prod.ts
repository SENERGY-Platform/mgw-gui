import { SecretManagerServiceService } from "src/app/core/services/secret-manager/secret-manager-service.service";
import { ModuleManagerService } from "../app/core/services/module-manager/module-manager-service.service";

export const environment = {
    production: true,
    moduleManagerService: ModuleManagerService,
    secretManagerService: SecretManagerServiceService
};