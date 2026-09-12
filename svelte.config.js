// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: preprocess(),
  kit: {
    adapter: adapter({
      pages:   'docs',
      assets:  'docs',
      // SPA mode: serve index.html for any route (dynamic or unknown)
      fallback: 'index.html'
    }),
    // base path under GitHub Pages
    paths: {
      base: dev ? '' : '/mc-careers-dashboard'
    }
  }
};
