import {Service, PlatformAccessory} from 'homebridge';

import { AirplayWatcherPlatform } from './airplayWatcherPlatform';

/**
 * Airplay Accessory
 * An instance of this class is created for each accessory the platform registers.
 * Each accessory may expose multiple services of different service types.
 */
export class AirplayAccessory {
  private static readonly RELAY_BITMASK = 0x800; //12th bit
  private static readonly SESSION_ACTIVE_BITMASK = 0x20000; //18th bit

  private readonly motionSensor: Service;
  private readonly accessoryInfo: Service;

  constructor(
    private readonly platform: AirplayWatcherPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessoryInfo = this.accessory.getService(this.platform.Service.AccessoryInformation)!;
    this.motionSensor = this.accessory.getService(this.platform.Service.MotionSensor) ||
      this.accessory.addService(this.platform.Service.MotionSensor);

    // set the service name, displayed as the default name on the Home app
    this.motionSensor.setCharacteristic(this.platform.Characteristic.Name, accessory.context.name);

    // default
    this.motionSensor.updateCharacteristic(this.platform.Characteristic.MotionDetected, false);
  }

  parsePackage(rdata) {
    this.platform.log.debug('Parsing package for "%s":\n%s', this.accessory.displayName, rdata);

    // MotionSensor
    if (rdata.flags) {
      const isActive = this.isPlaybackActive(rdata.flags);
      this.motionSensor.updateCharacteristic(this.platform.Characteristic.MotionDetected, isActive);
    }

    // AccessoryInformation
    this.setAccessoryInfo(this.platform.Characteristic.Model, rdata.model);
    this.setAccessoryInfo(this.platform.Characteristic.Manufacturer, rdata.manufacturer);
    this.setAccessoryInfo(this.platform.Characteristic.SerialNumber, rdata.serialNumber);
  }

  private isPlaybackActive(status): boolean {
    // DeviceSupportsRelay is reliable for audio devices (Homepod, Airport Express),
    // while ReceiverSessionIsActive is reliable for playback on an AppleTV.
    // See https://github.com/openairplay/airplay-spec/blob/master/src/status_flags.md.
    return ((AirplayAccessory.RELAY_BITMASK | AirplayAccessory.SESSION_ACTIVE_BITMASK) & status) > 0;
  }

  private setAccessoryInfo(characteristic, value) {
    if (value) {
      this.accessoryInfo.setCharacteristic(characteristic, value);
    }
  }

}
