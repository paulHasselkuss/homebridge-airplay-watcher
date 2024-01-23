import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { AirplayWatcherPlatform } from './airplayWatcherPlatform';

/**
 * Registers the platform with Homebridge.
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, AirplayWatcherPlatform);
};
