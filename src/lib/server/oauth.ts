import { BattleNet } from 'arctic';
import { AUTH_URL, BATTLENET_CLIENT_ID, BATTLENET_CLIENT_SECRET } from '$env/static/private';

const redirectUrl = `${AUTH_URL}/api/login/battlenet/callback`;

export const battlenet = new BattleNet(BATTLENET_CLIENT_ID, BATTLENET_CLIENT_SECRET, redirectUrl);
