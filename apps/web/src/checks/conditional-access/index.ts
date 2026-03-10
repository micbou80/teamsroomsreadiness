import { registerChecks } from '../registry';
import { excludedFromGeneric } from './excluded-from-generic';
import { dedicatedPolicyExists } from './dedicated-policy-exists';
import { noUnsupportedSessionControls } from './no-unsupported-session-controls';
import { noSignInFrequency } from './no-signin-frequency';

export const conditionalAccessChecks = [
  excludedFromGeneric,
  dedicatedPolicyExists,
  noUnsupportedSessionControls,
  noSignInFrequency,
];

registerChecks(conditionalAccessChecks);
