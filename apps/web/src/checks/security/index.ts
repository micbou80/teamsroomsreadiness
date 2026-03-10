import { registerChecks } from '../registry';
import { defenderActiveCheck } from './defender-active';
import { adminPasswordChangedCheck } from './admin-password-changed';
import { secureBootTpmCheck } from './secure-boot-tpm';
import { noUnsupportedSoftwareCheck } from './no-unsupported-software';

registerChecks([defenderActiveCheck, adminPasswordChangedCheck, secureBootTpmCheck, noUnsupportedSoftwareCheck]);
