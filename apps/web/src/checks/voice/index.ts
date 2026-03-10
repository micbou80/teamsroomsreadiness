import { registerChecks } from '../registry';
import { pstnModelCheck } from './pstn-model';
import { emergencyCallingCheck } from './emergency-calling';
import { sbcHealthCheck } from './sbc-health';

registerChecks([pstnModelCheck, emergencyCallingCheck, sbcHealthCheck]);
