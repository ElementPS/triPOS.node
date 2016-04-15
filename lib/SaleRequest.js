'use strict';

module.exports = class SaleRequest {
  constructor(options) {
    this.address = options.address;
    this.cashbackAmount = options.cashbackAmount || 0.0;
    this.confenienceFeeAmount = options.confenienceFeeAmount || 0.0;
    this.emvFallbackReason = options.emvFallbackReason || "None";
    this.tipAmount = options.tipAmount || 0.0;
    this.transactionAmount = options.transactionAmount;
    this.clerkNumber = options.clerkNumber || "Clerk101";
    this.configuration = options.configuration;
    this.laneId = options.laneId || 9999;
    this.referenceNumber = options.referenceNumber || "Ref000001";
    this.shiftId = options.shiftId || "ShiftA",
    this.ticketNumber = options.ticketNumber || "T0000001"
  }
  
  toJSON() {
    return {
      address: this.address.toJSON(),
      cashbackAmount:this.cashbackAmount,
      confenienceFeeAmount: this.confenienceFeeAmount,
      emvFallbackReason: this.emvFallbackReason,
      tipAmount: this.tipAmount,
      transactionAmount: this.transactionAmount,
      clerkNumber: this.clerkNumber,
      configuration: this.configuration,
      laneId: this.laneId,
      referenceNumber: this.referenceNumber,
      shiftId: this.shiftId,
      ticketNumber: this.ticketNumber
    };
  }
}

