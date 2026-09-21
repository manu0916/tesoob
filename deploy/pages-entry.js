import application from './server/index.js';

const worker = {
  async fetch(request, env, context) {
    const path = new URL(request.url).pathname;
    if (
      path.startsWith('/media/') ||
      path.startsWith('/fonts/') ||
      path.startsWith('/_next/static/')
    ) {
      return env.ASSETS.fetch(request);
    }
    return application.fetch(request, env, context);
  },
};
export default worker;
