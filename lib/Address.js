'use strict';

module.exports = class Address {
  constructor(options) {
    this.BillingAddress1 = options.BillingAddress1 || "123 Sample Stree";
    this.BillingAddress2 = options.BillingAddress2 || "Suite 101";
    this.BillingCity = options.BillingCity || "Chandler";
    this.BillingPostalCode = options.BillingCity ||  "85224";
    this.BillingState = options.BillingState || "AZ";
  }

  toJSON() {
    return {
      BillingAddress1: this.BillingAddress1,
      BillingAddress2: this.BillingAddress2,
      BillingCity: this.BillingCity,
      BillingPostalCode: this.BillingPostalCode,
      BillingState: this.BillingState
    };
  }
}

