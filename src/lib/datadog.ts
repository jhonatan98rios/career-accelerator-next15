import tracer from 'dd-trace';

if (!tracer.tracer) {
  tracer.init({
    service: "my-next-app",
    env: process.env.NODE_ENV,
    version: "1.0.0",
  });
}

export default tracer;