const {ServiceBroker} = require('moleculer');
const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

const broker = new ServiceBroker({
  ...(process.env.NAMESPACE ? {namespace: process.env.NAMESPACE} : {}),
  transporter: process.env.TRANSPORTER || 'nats://nats:4222',
  tracing: {
    enabled: true,
    exporter: {
      type: 'Jaeger',
      options: {
        host: 'jaeger'
      }
    }
  }
});

broker.createService({
  name: 'cache',
  mixins: [DbService],
  adapter: new MongoDBAdapter(process.env.MONGODB || 'mongodb://mongo/moleculer-poc'),
  collection: 'cache',
});

broker.start();
