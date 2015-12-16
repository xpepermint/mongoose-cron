# [mongoose](http://mongoosejs.com)-cron

> MongoDB collection as crontab

MongooseCron offers a simple API for scheduling tasks and running recurring jobs on one or multiple database collections. The package is build on top of [MongoDB](https://www.mongodb.org) and [Mongoose](http://mongoosejs.com). It's fast and it uses atomic commands to ensure safe job execution in cluster environments.

<img src="giphy.gif" />

## Setup

```
$ npm install --save mongoose-cron
```

## Quick Start

Let's say we have a simple application like the one below.

```js
import mongoose from 'mongoose';
mongoose.Promise = Promise;

let db = mongoose.connect('mongodb://localhost:27017/testdb');
let schema = new mongoose.Schema({name: String});
let Task = db.model('Task', schema);
```

To convert the Task model into a crontab collection, attach the plugin, create a cron worker instance, then call the `start` method on it to start processing.

```js
import {cronPlugin} from 'mongoose-cron';

let schema = new mongoose.Schema({name: String});
schema.plugin(cronPlugin, {
  handler: doc => console.log('processing', doc)
});

let Task = db.model('Task', schema);
let cron = Task.createCron();
cron.start(); // call `cron.stop()` to stop processing
```

We can now create our first job.

```js
Task.create({
  startAt: new Date('2015-12-12T09:00:00.010Z'),
  stopAt: new Date('2016-12-12T09:00:00.010Z'),
  schedule: '* * * * * *' // run every second
});
```

## Configuration & Details

The package includes several of useful cron methods and configuration options. We can configure cron functionality by passing the `config` variable with options to the plugin or by passing options directly to the `Task.createCron` method.

```js
schema.plugin(cronPlugin, {
  config: {
    // When there are no jobs to process, wait 30s before
    // checking for processable jobs again (default: 0).
    idleDelay: 30000,
    // Wait 60s before processing the same job again in case
    // the job is a recurring job (default: 0).
    nextDelay: 60000
  }
});
```

We can create **recurring** or **one-time** jobs. Every time the job processing starts the `startedAt` field is replaced with the current date and the `state` field is set to `1`. When the processing ends the `processedAt` field is updated to the current date and the `state` is set to `0` (recurring) or `2` (expired).

By creating a document with the default plugin values we create a one-time job which starts processing immediately.

```js
model.create({});
```

Job execution can be delayed by setting the `startAt` field.

```js
model.create({
  startAt: new Date('2016-01-01')
});
```

By setting the `schedule` field we define a recurring job.

```js
model.create({
  schedule: '* * * * * *' // every second
});
```

A recurring job will repeat endlessly. We can limit that by setting the `stopAt` field. When a job expires it stops repeating and the `state` field is set to `2`. If we also set `removeExpired` field to `true`, a job is automatically deleted.

```js
model.create({
  startAt: new Date('2016-01-01'),
  schedule: '* * * * * *',
  stopAt: new Date('2020-01-01'),
  removeExpired: true
});
```

Sometimes we'll need to stop a job without touching its configuration fields. Set the `state` field to `-1` if you need to disable a job and set it back to `0` when you need to re-enable it.

## Example

You can run the attached example with the `npm run example` command.
