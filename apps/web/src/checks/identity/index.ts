import { registerChecks } from '../registry';
import { resourceAccountExists } from './resource-account-exists';
import { passwordExpiration } from './password-expiration';
import { noFirstLoginChange } from './no-first-login-change';
import { upnSmtpMatch } from './upn-smtp-match';
import { noInteractiveMfa } from './no-interactive-mfa';
import { namingConvention } from './naming-convention';

registerChecks([
  resourceAccountExists,
  passwordExpiration,
  noFirstLoginChange,
  upnSmtpMatch,
  noInteractiveMfa,
  namingConvention,
]);
