# PWA + Web Components News Reader Tutorial

In this tutorial I'll show you you how to build a Progressive Web Application (PWA) from scratch. We'll also encapsulate some of the reusable UI components into Web Components.

We'll start by building a normal, non-PWA, news reader app to give you a clear understanding of where everything is coming from and how the app communicates with the backend.

We'll then turn the application into a PWA step by step, first adding a web manifest file and and then configuring a ServiceWorker and caching.

## Prerequisites

You will need the following to complete the tutorial:

* Node and NPM installed
* A recent version of Chrome for DevTools
* A basic understanding of JavaScript and HTML or solid copypaste skills
* A free API key to [News API](https://newsapi.org)
* An editor you like to work with. I like [VS Code](https://code.visualstudio.com/)

## Download app foundation

Start by [downloading the app foundation](https://github.com/marcushellberg/alternative-news-web-components/archive/start.zip)

Run `npm install` in the unzipped folder and open it in your editor of choice.

## Fetch and show news articles

Now that we have the base of our app ready, let's start adding some functionality. What we want to do is

1.  Fetch the latest news articles from newsapi.org
2.  Display each article in a custom `<news-article>` element

In `app.js`, add a listener for the window `load` event. We want to defer all our JS work until the browser has had a chance to render the HTML.

```js
window.addEventListener('load', () => {
  fetchArticles();
});
```

Define a constant for the API key as we're going to use that in a few places.

```js
const apiKey = 'GET YOUR KEY FROM newsapi.org!';
```

Then, implement the `fetchArticles`-function.

```js
async function fetchArticles() {
  const res = await fetch(
    'https://newsapi.org/v2/top-headlines?apiKey=' + apiKey
  );
  const json = await res.json();
}
```

Here, we're using the `fetch` API to get the top news in the US, extracting the JSON content, which looks like this:

```json
{
  "status": "ok",
  "totalResults": 20,
  "articles": [
    {
      "source": {
        "id": "...",
        "name": "..."
      },
      "author": "...",
      "title": "...",
      "description": "...",
      "url": "...",
      "urlToImage": "...",
      "publishedAt": "..."
    }
  ]
}
```

Finally, we get hold of the `<main>` section, and append a `<news-article>` element for each of the articles in our JSON.

```js
async function fetchArticles() {
  // implemented above

  const main = document.querySelector('main');
  main.innerHTML = '';

  json.articles.forEach(article => {
    const el = document.createElement('news-article');
    el.article = article;
    main.appendChild(el);
  });
}
```

## Creating custom HTML elements

Our app won't work quite yet because we haven't provided the browser with an implementation for the custom `<news-article>` HTML element. Let's do that. Create a new `news-article.js` file.

In the file, we'll use the `customElements` API to define an implementation for our new tag:

```js
customElements.define('news-article', class extends HTMLElement {});
```

Now we have a class that will get instantiated any time the browser encounters a `<news-article>` tag in our code. To have it actually do something, let's define a setter for `article`:

```js
customElements.define(
  'news-article',
  class extends HTMLElement {
    set article(article) {
      this.innerHTML = `
            <a href="${article.url}">
              <h2>${article.title}</h2>
              <img src="${article.urlToImage ? article.urlToImage : ''}">
              <p>${article.description}</p>
            </a>`;
    }
  }
);
```

Whenever we set the `article` property on one of our `<news-article>` tags, it will now construct it's own inner HTML.

Finally, import the file at the top of your `app.js`:

```js
import './news-article.js';
```

**Run your application.** If everything went well, you should now be seeing some news headlines. Nice! 👏

```
npm run serve
```

If things didn't work, open up Chrome DevTools (`⌘-⌥-I` or `Ctrl-Shift-I`) and see if you can figure out what's wrong.

## Moving our content into the shadows of Shadow DOM

Our current implementation of `<news-article>` is fine for what we're using it for, but it's fairly tightly coupled to our application and exposes all of it's internals to the end users.

If we wanted to make it more reusable, we could hide the implementation details into a Shadow DOM, and bundle all the styles the component needs into it. This way, others on our team can just grab our component and use it without needing to know how it was implemented. Kind of like how you use a `<select>` without caring how it's implemented in the browser.

Add the following constructor to the class in `news-article.js`:

```js
constructor() {
  super();
  this.root = this.attachShadow({ mode: 'open' });
}
```

This creates a Shado DOM for our component, essentially hiding and sandboxing all of our internals from the world.

Change the `article` setter to append the HTML content to the Shadow DOM instead of `innerHTML`:

```js
set article(article) {
  this.root.innerHTML = `...`;
}
```

If you refresh your browser now, you'll notice that the styles broke completely. This is because the Shadow DOM protects the content of our component from outside CSS. Likewise, any CSS we define won't leak out into the main document.

To fix the styles, remove the `news-article` related CSS selectors from `styles.css`. Instead, we'll define the styles inside our Shadow DOM:

```js
set article(article) {
  this.root.innerHTML = `
        <style>
          h2 {
            font-family: Georgia, 'Times New Roman', Times, serif;
          }
          a,
          a:visited {
            text-decoration: none;
            color: inherit;
          }
          img {
            width: 100%;
          }
         </style>
         <a href="${article.url}">
           <h2>${article.title}</h2>
           <img src="${article.urlToImage ? article.urlToImage : ''}">
           <p>${article.description}</p>
         </a>`;
}
```

Since we're now inside the DOM-tree of our component, we no longer need to have the `news-article` selector.

Refresh your browser, and all should be well again 😌

## Optional extra credit: Get 🔥

_That's nice and all, but aren't we changing the entire DOM of our component for every change now?_ - you may ask. That can't be efficient! One solution is to bring in a framework like React to handle DOM manipulation more efficiently through a virtual DOM approach.

However, there's another approach we can take that uses standard browser technologies (HTML template tags and ES template literals) to achieve super efficient rendering without a framework. The library is called [lit-html](https://github.com/Polymer/lit-html).

Let's install lit-html and import it at the top of our `news-article.js` file.

```
npm install --save lit-html
```

```js
import { html, render } from './node_modules/lit-html/lit-html.js';
```

**Note** Since we are not using any build tooling, we need to provide the full path to the import. If you are using Polymer CLI, WebPack or similar (see end of tutorial), you can import the bare module specifier.

Instead of always recreating the DOM of our component when setting the article, we'll define a template as a function of an article. This way, updating the article will only update the affected parts of the template.

In the constructor in `news-article.js`, define the following function:

```js
this.template = article => html`
<style>
  h2 {
    font-family: Georgia, 'Times New Roman', Times, serif;
  }
  a,
  a:visited {
    text-decoration: none;
    color: inherit;
  }
  img {
    width: 100%;
  }
</style>
<a href="${article.url}">
  <h2>${article.title}</h2>
  <img src="${article.urlToImage ? article.urlToImage : ''}">
  <p>${article.description}</p>
</a>`;
```

After defining the template function, the `article` setter becomes much simpler:

```js
set article(article) {
  render(this.template(article), this.root);
}
```

Lit-html will now take care of only updating the changed parts of our DOM whenever the article gets updated.

## Selecting news sources

Now that we have a way of showing articles, let's add a way of selecting a news source.

Start by adding a select in the `header` section of `index.html`:

```html
<header>
  <h1>Alternative news</h1>
  <select id="sources"></select>
</header>
```

In `app.js`, create a new function `setupSources`:

```js
async function setupSources() {
  const response = await fetch(
    `https://newsapi.org/v2/sources?apiKey=${apiKey}`
  );
  const json = await response.json();

  const sourceSelector = document.querySelector('#sources');
  sourceSelector.innerHTML = json.sources
    .map(source => `<option value="${source.id}">${source.name}</option>`)
    .join('\n');

  sourceSelector.addEventListener('change', evt =>
    fetchArticles(evt.target.value)
  );
}
```

Here, we fetch the available news sources as JSON and map each to an `<option>` that we append to our select. We also add a listener on the select so we can fetch the appropriate news.

> **Extra credit** If you used lit-html in the earlier step, see how you could use that to [bind the options more efficiently to a list of items](https://polymer.github.io/lit-html/guide/writing-templates.html#directives).

Update `fetchArticles` to accept a source argument. The API needs us to provide either a source id or

```js
async function fetchArticles(source) {
  let url = 'https://newsapi.org/v2/top-headlines?apiKey=' + apiKey;
  if (source) {
    url += `&sources=${source}`;
  } else {
    url += `&country=us`;
  }
  const res = await fetch(url);
  const json = await res.json();

  // no changes to the rest of the method.
}
```

Finally, call `setupSources()` in the `load` listener:

```js
window.addEventListener('load', () => {
  setupSources(); // <--
  fetchArticles();
});
```

Refresh your browser and you should now be able to select news sources and see the articles update.

## Turning our app into a PWA: adding a Web App Manifest

Now that we have a working application, we can start turning it into a PWA. There are two main components to doing this:

* Adding a [Web App Manifest]()
* Adding a [ServiceWorker]()

We'll start by creating a manifest file that identifies our application to the browser. In your project folder, create a file `manifest.json` and add the following content:

```json
{
  "name": "Alternative News",
  "short_name": "News",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#fff",
  "description": "An alternative news app.",
  "icons": [
    {
      "src": "images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

The manifest tells the browser the name of our app, what colors should be used for a splash screen and what icon should be used if the application is installed to a device.

To add the manifest to our application, we link it from the `<head>` of our `index.html`:

```html
<link rel="manifest" href="./manifest.json">
```

Refresh your browser, open DevTools and go to Application > Manifest. You should see that all the information we entered got picked up.

## Going offline, part 1: Caching static assets

In order for our application to work offline, we need to make sure our content is cached and ready to use if there is no connection available.

The ServiceWorker is a JavaScript worker that sits between your application and the network. You can use it to intercept network calls and provide resources from a cache. But before we can do that, we need to put some things in the cache.

Create a `sw.js` file in the project folder. In it, we will define a cache name and the list of our static assets.

```js
const cacheName = 'news-v1';
const staticAssets = [
  './',
  './index.html',
  './styles.css',
  //if you did extra credit:
  './node_modules/lit-html/lit-html.js',
  './app.js'
];
```

We will then add a listener for the `install` event to populate the cache using the `Cache` API and the cache name we defined.

```js
self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  cache.addAll(staticAssets);
});
```

> A ServiceWorker gets updated whenever there is even a single byte change in the file. The new ServiceWorker gets installed, but not activated before you exit all tabs using it. You can read more about the lifecycle of a ServiceWorker [here](https://developers.google.com/web/fundamentals/primers/service-workers/).
> **To make development easier, check "Update on reload" in DevTools > Application > ServiceWorker**.

Now that we have a ServiceWorker, we need to tell the browser about it. In your `app.js`, add the following function and call it from the `load` listener:

```js
window.addEventListener('load', () => {
  setupSources();
  fetchArticles();
  registerSW(); // <--
});

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.log(`SW registration failed`);
    }
  }
}
```

If you **refresh your browser** now, you should see your cached content under the Cache Storage. section of the Application tab.

With our static content cached, we can add another listener for `fetch` events and provide them to the browser directly from our cache instead of hitting the network:

```js
self.addEventListener('fetch', async e => {
  e.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}
```

Refresh your browser and make sure your new ServiceWorker got loaded (remember to check "update on reload" in the ServiceWorker section of the Application tab). You can now check the "offline" checkbox to simulate a loss of connectivity. If all went well, you should see the app header instead of an offline dinosaur. We're making progress! 😎

> **WARNING** Here we're creating and managing our cache manually to learn how a ServiceWorker functions. **Caching files manually is not recommended in production environments**. Check out the link to Workbox at the end of this tutorial.

## Going offline, part 2: Runtime caching

Although our app is now able to start offline, it's not very useful. We want our users to be able to browse any news they have already seen while online, and get a nice fallback if they try to access a news source that hasn't been cached.

Start by updating the `fetch` listener:

```js
self.addEventListener('fetch', async e => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    e.respondWith(networkAndCache(req));
  }
});
```

We now differentiate between local requests, which we serve from cache, and external requests which will try to fetch updated content from the network and fall back on a cached version if that fails.

Implement the `networkAndCache` function:

```js
async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || (await cache.match('./fallback.json'));
  }
}
```

Within the try-block, we fetch a the latest content. If that succeeds, we clone the response into our cache and return it. If it fails, we return either a cached version of the response or a pre-cached fallback JSON file.

Normally, a ServiceWorker doesn't kick in until you visit the page the next time. In our case, we want it to start caching network requests right away. To do this, we'll call `skipWaiting()` in the `install` listener, which will immediately activate the ServiceWorker. We can then add an `activate` event listener and tell the ServiceWorker to claim all clients, that is start controlling all tabs that have loaded the ServiceWorker.

```js
self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting(); // <-- add this
});

self.addEventListener('activate', e => {
  self.clients.claim();
});
```

Finally, add two fallback files to the static assets array:

```js
const staticAssets = [...'./fallback.json', './images/fetch-dog.jpg'];
```

**Refresh your browser** and make sure the new ServiceWorker got loaded. You should start seeing API calls getting cached if you look at the Cache Storage section of the Application tab.

After you have navigated to a few news sources, go offline and refresh. You should be able to browse the sources you've already viewed and get a nice fallback if you try to access a source you haven't cached.

## Celebrate

Provided that my tutorial was correct and you copypasted diligently, you should now have a working PWA. Good job! 👍

Pat yourself on the back, update your resume, and head out for some 🍻

## Next steps

As this tutorial focused on teaching the basics of PWA, it did not cover production builds. You should look into [Webpack](https://webpack.js.org/) or [Rollup](https://rollupjs.org/) and [Workbox](https://workboxjs.org/) for that. Alternatively, check out[PWA Starter Kit](https://github.com/Polymer/pwa-starter-kit) for a more complete solution.
