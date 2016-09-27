# [mongoose](http://mongoosejs.com)-cron

> MongoDB collection as crontab

MongooseCron is build on top of [MongoDB](https://www.mongodb.org) and [Mongoose](http://mongoosejs.com). It offers a simple API for scheduling tasks and running recurring jobs on one or multiple database collections, supporting models and discriminators. It's fast, minimizes processing overhead and it uses atomic commands to ensure safe job executions in cluster environments.

<img src="giphy.gif" />

## Setup

```
$ npm install --save mongoose-cron
```

## Quick Start

Let's say we have a simple application like the one below.

```js
import mongoose from 'mongoose';

let db = mongoose.connect('mongodb://localhost:27017/testdb');
let schema = new mongoose.Schema({name: String});
let Task = db.model('Task', schema);
```

To convert the Task model into a crontab collection, attach the plugin, create a cron worker instance, then call the `start` method on it to start processing.

```js
import {cronPlugin} from 'mongoose-cron';

let schema = new mongoose.Schema({name: String});
schema.plugin(cronPlugin, {
  handler: doc => console.log('processing', doc) // function or promise
});

let Task = db.model('Task', schema);
let cron = Task.createCron().start(); // call `cron.stop()` to stop processing
```

We can now create our first job.

```js
Task.create({
  cron: {
    enabled: true,
    startAt: new Date('2015-12-12'),
    stopAt: new Date('2016-12-12'),
    interval: '* * * * * *' // run every second
  }
});
```

**IMPORTANT:** Any document in the `tasks` collection above can become a cron job. We just have to set at least the `cron.enabled` field to `true`.

## Configuration & Details

The package includes several useful methods and configuration options. We can configure cron functionality by passing the additional options to the plugin or by passing them directly to the `Task.createCron` method.

```js
schema.plugin(cronPlugin, {
  ...
  // When there are no jobs to process, wait 30s before
  // checking for processable jobs again (default: 0).
  idleDelay: 30000,
  // Wait 60s before processing the same job again in case
  // the job is a recurring job (default: 0).
  nextDelay: 60000,
  // Object or Array of Objects to add to the find query.
  // The value is concatinated with the $and operator.
  // (default: [])
  addToQuery: { version: { $lte: 1 } }
});
```

We can create **recurring** or **one-time** jobs. Every time the job processing starts the `cron.startedAt` field is replaced with the current date and the `cron.locked` field is set to `true`. When the processing ends the `cron.processedAt` field is updated to the current date and the `cron.locked` field is removed.

We can create a one-time job which will start processing immediately just by setting the `cron.enabled` field to `true`.

```js
model.create({
  cron: {
    enabled: true
  }
});
```

Job execution can be delayed by setting the `cron.startAt` field.

```js
model.create({
  cron: {
    ...
    startAt: new Date('2016-01-01')
  }
});
```

By setting the `cron.interval` field we define a recurring job.

```js
model.create({
  cron: {
    ...
    interval: '* * * * * *' // every second
  }
});
```

The interval above consists of 6 values.

```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59)
```

A recurring job will repeat endlessly unless we limit that by setting the `cron.stopAt` field. When a job expires it stops repeating. If we also set `cron.removeExpired` field to `true`, a job is automatically deleted.

```js
model.create({
  cron: {
    enabled: true,
    startAt: new Date('2016-01-01'),
    interval: '* * * * * *',
    stopAt: new Date('2020-01-01'),
    removeExpired: true
  }
});
```

## Example

You can run the attached example with the `npm run example` command.

## Alternatives

There is a very similar package called [mongodb-cron](https://github.com/xpepermint/mongodb-cron), which uses the [officially supported Node.js driver](https://docs.mongodb.com/ecosystem/drivers/node-js/) for MongoDB.
