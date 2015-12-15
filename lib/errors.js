'use strict';

class CronNoDocumentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CronNoDocumentError';
    this.message = message || 'No document for processing.';
  }
}

module.exports = {CronNoDocumentError};
