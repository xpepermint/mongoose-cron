'use strict';

/* initializing mongodb */
const mongoose = require('mongoose');
mongoose.Promise = Promise;
let db = mongoose.connect('mongodb://localhost:27017/testdb');

/* initializing cron model */
const cronPlugin = require('..').cronPlugin;
let taskSchema = new mongoose.Schema({});
taskSchema.plugin(cronPlugin, {
  handler: doc => console.log('processing', doc._id)
});

let Task = db.model('Task', taskSchema);
let cron = Task.createCron().start();

/* seeding cron model */

Task.findOneAndUpdate({_id: '565781bba17d0e685f8e2086'}, {
  start: 0,
  startAt: new Date(),
  stopAt: new Date('2015-12-17T00:16:00.010+0100'),
  schedule: '* * * * * *',
  removeExpired: true
}, {upsert: true, setDefaultsOnInsert: true, new: true}).then(console.log).catch(console.log);
