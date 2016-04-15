'use strict';

module.exports = class Config {
  constructor(configPath, address, authVersion) {
    this.pathToConfig = configPath;
    this.serviceAddress = address;
    this.tpAuthorizationVersion = authVersion;
    this.useJSON = true;
  }
}
