import { registerChecks } from '../registry';
import { roomMailboxExists } from './room-mailbox-exists';
import { mailboxTimezone } from './mailbox-timezone';
import { calendarProcessing } from './calendar-processing';
import { ewsRetirementImpact } from './ews-retirement-impact';
import { externalMeetingProcessing } from './external-meeting-processing';

export const calendarChecks = [
  roomMailboxExists,
  mailboxTimezone,
  calendarProcessing,
  ewsRetirementImpact,
  externalMeetingProcessing,
];

registerChecks(calendarChecks);
