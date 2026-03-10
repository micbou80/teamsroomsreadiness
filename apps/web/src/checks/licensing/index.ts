import { registerChecks } from '../registry';
import { roomsLicenseAvailable } from './rooms-license-available';
import { noSharedDeviceLicense } from './no-shared-device-license';
import { basicLicenseCap } from './basic-license-cap';
import { proServicePlans } from './pro-service-plans';
import { licenseAssignment } from './license-assignment';

registerChecks([
  roomsLicenseAvailable,
  noSharedDeviceLicense,
  basicLicenseCap,
  proServicePlans,
  licenseAssignment,
]);
