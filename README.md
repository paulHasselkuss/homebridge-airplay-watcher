# Homebridge Airplay Watcher
[![Build and Lint](https://github.com/paulHasselkuss/homebridge-airplay-watcher/actions/workflows/build.yml/badge.svg)](https://github.com/paulHasselkuss/homebridge-airplay-watcher/actions/workflows/build.yml)
[![License](https://img.shields.io/github/license/paulHasselkuss/homebridge-airplay-watcher)](LICENSE.md)

This [Homebridge](http://homebridge.io) plugin allows you to watch for devices starting or stopping playing airplay audio. For each device, a motion detector is exposed that becomes active when audio is played, and inactive when no audio is being played.

## Configuration
The easiest way to use this plugin is to use [homebridge-config-ui-x](https://github.com/homebridge/homebridge-config-ui-x). To configure manually, add the `AirplayWatcherHomebridgePlugin` platform in your `config.json` file. Then, add devices to monitor:

```JSON
{
"platform": "AirplayWatcherHomebridgePlugin",
  "devices": [
    {
      "name": "The name of the device as configured in the Apple Home app (case sensitive), e.g. 'MyAirportExpress'."
    }
  ]
}
```

## Technicalities
The plugin monitors UDP traffic for MDNS records from Airplay devices. Certain Airplay MDNS TXT records include a [bitmask](https://github.com/openairplay/airplay-spec/blob/master/src/status_flags.md) which allows predicting the device's state (playing or not). For this to work, Homebridge needs to run on the same network as the Airplay device.

See [airplay-music-watcher](https://github.com/scosman/airplay-music-watcher/), [homebridge-airport-express-playing](https://github.com/apexad/homebridge-airport-express-playing/tree/master), and [this](https://www.reddit.com/r/homebridge/comments/jxt9le/added_a_switch_in_homebridge_to_show_if_airport/) thread on reddit for similar approaches and further information.

## License
[MIT](LICENSE.md)

