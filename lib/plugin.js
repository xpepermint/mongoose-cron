'use strict';

const Cron = require('./Cron');

module.exports = function(schema, options) {
  if (!options) options = {};

  schema.add({
    startAt: { // first possible start date
      type: Date,
      default: () => new Date()
    },
    stopAt: { // last possible start date (`null` if not recurring)
      type: Date
    },
    startedAt: { // (automatic) set every time a job processing starts
      type: Date
    },
    processedAt: { // (automatic) set every time a job processing ends
      type: Date
    },
    schedule: { // cron string interval (e.g. `* * * * * *`)
      type: String
    },
    state: { // (automatic) job state (0=pending, 1=processing, 2=expired)
      type: Number,
      default: 0
    },
    removeExpired: { // set to `true` for the expired jobs to be automatically deleted
      type: Boolean,
      default: false
    }
  });

  schema.index(
    {state: 1, start: 1, until: 1}
  );

  schema.method('isPending', function() {
    return this.state === 0;
  });

  schema.method('isProcessing', function() {
    return this.state === 1;
  });

  schema.method('isEnabled', function() {
    return [0, 1].indexOf(this.state) !== -1;
  });

  schema.method('isExpired', function() {
    return this.state === 2;
  });

  schema.statics.createCron = function(config) {
    let cfg = Object.assign({}, options.config, config);
    return new Cron(this, options.handler, cfg);
  };
};
