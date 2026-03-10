import { registerChecks } from '../registry';
import { udpPortsReachable } from './udp-ports-reachable';
import { tcp443Reachable } from './tcp-443-reachable';
import { noProxyAuth } from './no-proxy-auth';
import { tlsInspectionBypass } from './tls-inspection-bypass';
import { websocketPermitted } from './websocket-permitted';
import { bandwidthAdequate } from './bandwidth-adequate';

export const networkChecks = [
  udpPortsReachable,
  tcp443Reachable,
  noProxyAuth,
  tlsInspectionBypass,
  websocketPermitted,
  bandwidthAdequate,
];

registerChecks(networkChecks);
