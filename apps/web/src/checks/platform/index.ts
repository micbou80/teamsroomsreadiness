import { registerChecks } from '../registry';
import { windowsVersionCheck } from './windows-version';
import { osSkuCheck } from './os-sku';
import { appVersionCheck } from './app-version';
import { noLtscCheck } from './no-ltsc';

registerChecks([windowsVersionCheck, osSkuCheck, appVersionCheck, noLtscCheck]);
