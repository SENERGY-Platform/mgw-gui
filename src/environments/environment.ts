import { SecretManagerMockService } from "src/app/core/services/secret-manager/secret-manager-mock-service";
import { ModuleManagerMockService } from "../app/core/services/module-manager/module-manager-mock.service";

export const environment = {
    production: false,
    moduleManagerService: ModuleManagerMockService,
    secretManagerService: SecretManagerMockService
};