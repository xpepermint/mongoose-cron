'use strict';

/* initializing mongodb */

let dbhost = process.env.DB_HOST || 'localhost:27017';
let dbname = process.env.DB_NAME || 'testdb';

const mongoose = require('mongoose');
mongoose.Promise = Promise;
let db = mongoose.connect('mongodb://' + dbhost + '/' + dbname);

/* defining polymorphic model with support for cron */

const {cronPlugin} = require('..');

let noteSchema = new mongoose.Schema({
  name: {type: String}
});
let checklistSchema = new mongoose.Schema({
  description: {type: String}
});
let reminderSchema = new mongoose.Schema({
  description: {type: String}
});

noteSchema.plugin(cronPlugin, {
  handler: doc => console.log('processing', doc.id)
});

let Note = mongoose.model('Note', noteSchema);
let Checklist = Note.discriminator('Checklist', checklistSchema);
let Reminder = Note.discriminator('Reminder', reminderSchema);

/* creating cron worker and starting the heartbit */

let cron = Note.createCron().start();

/* sedding */

Checklist.findOneAndUpdate({_id: '565781bba17d0e685f8e2086'}, {
  name: 'Job 1',
  description: 'ignored by the cron heartbit'
}, {upsert: true, setDefaultsOnInsert: true, new: true}).then(res => {}).catch(console.log);

Reminder.findOneAndUpdate({_id: '565781bba17d0e685f8e2087'}, {
  name: 'Job 2',
  description: 'remined me every 1s',
  cron: {
    enabled: true,
    startAt: new Date(),
    interval: '* * * * * *'
  }
}, {upsert: true, setDefaultsOnInsert: true, new: true}).then(res => {}).catch(console.log);
