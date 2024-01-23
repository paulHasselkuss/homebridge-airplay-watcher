import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import mDnsSd from 'node-dns-sd';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AirplayAccessory } from './airplayAccessory';

/**
 * AirplayWatcherPlatform
 * The main constructor for the plugin. Parses the user config and registers accessories with Homebridge.
 */
export class AirplayWatcherPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // used to track restored cached accessories
  private readonly accessories: PlatformAccessory[] = [];
  private readonly devices: Map<string, AirplayAccessory> = new Map;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // Fired when all cached accessories have been restored. Dynamic Platform plugins should only
    // register new accessories after this event was fired, in order to ensure they weren't added already.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.registerDevices();
      this.startWatcher();
    });

    // Fired when Homebridge attempts to shut down. Should stop all ongoing watchers, etc.
    this.api.on('shutdown', () => {
      log.debug('Executed shutdown callback');
      this.stopWatcher();
    });

    this.log.debug('Finished initializing platform:', this.config.name);
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update any respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the cache
    this.accessories.push(accessory);
  }

  private registerDevices() {
    // loop over the configured devices and register those that have not already been registered
    for (const device of this.config.devices) {

      const name = device.name;
      const airplayServiceName = this.airplayServiceName(name);
      const uuid = this.api.hap.uuid.generate(airplayServiceName);

      // see if an accessory with the same uuid has already been registered and restored from the cache
      let accessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (!accessory) {
        this.log.info('Adding new accessory:', name);

        // create a new accessory
        accessory = new this.api.platformAccessory(name, uuid);
        accessory.context = {
          name,
          airplayServiceName,
          uuid,
        };

        // link the accessory to the platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      } else {
        this.log.info('Accessory restored from cache:', accessory.displayName);
        // no need to update the accessory, we only store the name from config which is also used to identify cached devices
      }
      this.devices.set(this.airplayServiceName(name), new AirplayAccessory(this, accessory));
    }
  }

  private startWatcher() {
    if (!this.devices) {
      this.log.warn('No devices configured.');
      return;
    }

    mDnsSd.ondata = (packet) => {
      if (!packet.answers) {
        return;
      }
      for (const answer of packet.answers) {
        if (!answer.name || !answer.rdata || !this.devices.has(answer.name) ) {
          continue;
        }
        this.devices.get(answer.name)!.parsePackage(answer.rdata);
      }
    };

    mDnsSd.startMonitoring().then(() => {
      this.log.debug('mDNS watcher started...');
    }).catch((error) => {
      this.log.error('mDNS watcher encountered an error:', error);
    });
  }

  private stopWatcher() {
    mDnsSd.stopMonitoring().then(() => {
      this.log.debug('mDNS monitor stopped.');
    }).catch((error) => {
      this.log.warn('Error while stopping mDNS monitor:', error);
    });
  }

  private airplayServiceName(name: string) {
    // devices broadcast the name via mDNS, spaces are supported
    return `${name}._airplay._tcp.local`;
  }
}
