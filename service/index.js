const {ServiceBroker} = require('moleculer');
const {MoleculerClientError} = require('moleculer').Errors;

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

// This is an horrible way to cache results, it only serves as a demonstration of a database service.
const cache = operator => fn => async ctx => {
  const query = {
    operator,
    left: ctx.params.left,
    right: ctx.params.right
  };
  try {
    const span = ctx.startSpan('cache find', {
      tags: {
        query
      }
    });
    const cached = await ctx.call('cache.find', {query});
    ctx.finishSpan(span);
    if (cached.length) {
      const c = cached[0];
      console.log(`cache hit: ${c.operator}(${c.left}, ${c.right}) = ${c.result}`);
      return c.result;
    }
  } catch (error) {
    console.error('Failed to access cache:', error);
  }
  const result = await fn(ctx);
  const span = ctx.startSpan('cache create', {
    tags: {
      query,
      result
    }
  });
  ctx.call('cache.create', {...query, result})
    .catch(error => console.error('Failed to create cache entry:', error))
    .finally(() => ctx.finishSpan(span));
  return result;
};

broker.createService({
  name: 'calculator',
  actions: {
    add: {
      handler: cache('add')(ctx => Number(ctx.params.left) + Number(ctx.params.right)),
      tracing: {
        tags: {
          params: ['left', 'right']
        },
        spanName: 'calculator.add'
      }
    },
    substract: cache('substract')(ctx => Number(ctx.params.left) - Number(ctx.params.right)),
    multiply: cache('multiply')(ctx => Number(ctx.params.left) * Number(ctx.params.right)),
    divide: cache('divide')(ctx => {
      const left = Number(ctx.params.left);
      const right = Number(ctx.params.right);
      if (right === 0) {
        throw new MoleculerClientError('Cannot divide by 0', 400, 'ERR_DIV_BY_NULL', {left, right});
      }
      return left / right;
    })
  }
});

broker.start();
