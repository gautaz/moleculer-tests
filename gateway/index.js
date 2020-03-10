const { ServiceBroker } = require('moleculer')
const ApiService = require('moleculer-web')

const broker = new ServiceBroker({
  ...(process.env.NAMESPACE ? { namespace: process.env.NAMESPACE } : {}),
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
})

broker.createService({
  mixins: [ApiService],
  settings: {
    port: process.env.PORT || 0
  }
})

broker.start()
