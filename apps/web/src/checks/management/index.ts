import { registerChecks } from '../registry';
import { pmpConnectivityCheck } from './pmp-connectivity';
import { intuneEnrollmentCheck } from './intune-enrollment';
import { updateRingsCheck } from './update-rings';

registerChecks([pmpConnectivityCheck, intuneEnrollmentCheck, updateRingsCheck]);
