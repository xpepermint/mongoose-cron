'use strict';
const mongoose = require('mongoose');
const mc = require('..');

/* initializing mongodb */

mongoose.Promise = Promise;
let db = mongoose.connect('mongodb://localhost:27017/testdb');

/* initializing cron model */
let taskSchema = new mongoose.Schema({});
taskSchema.plugin(mc.cronPlugin);
let Task = db.model('Task', taskSchema);

/* initializing nad starting cron */

const cron = new mc.Cron(Task, doc => {
  console.log('Echo every second:', doc._id);
  return Promise.resolve();
});
cron.start();

/* seeding cron model */

Task.findOneAndUpdate({_id: '565781bba17d0e685f8e2086'}, {
  start: 0,
  startAt: new Date(),
  stopAt: new Date('2015-12-16T00:16:00.010+0100'),
  schedule: '* * * * * *',
  removeExpired: true
}, {upsert: true, setDefaultsOnInsert: true, new: true}).then(console.log).catch(console.log);
