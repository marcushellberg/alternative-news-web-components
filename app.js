const apiKey = 'http://newsapi.org/';

window.addEventListener('load', async () => {
  setupSources();
  fetchArticles();
  registerSW();
});

window.addEventListener('online', () => location.reload());

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.log(`SW registration failed`);
    }
  }
}

async function setupSources() {
  const res = await fetch('https://newsapi.org/v2/sources?apiKey=' + apiKey);
  const json = await res.json();

  const sourceSelector = document.querySelector('vaadin-combo-box');
  sourceSelector.items = json.sources;

  sourceSelector.addEventListener('value-changed', e => {
    fetchArticles(sourceSelector.value);
  });
}

async function fetchArticles(source) {
  let url = 'https://newsapi.org/v2/top-headlines?apiKey=' + apiKey;
  if (source) {
    url += `&sources=${source}`;
  } else {
    url += `&country=us`;
  }
  const res = await fetch(url);
  const json = await res.json();

  const main = document.querySelector('main');
  main.innerHTML = '';

  json.articles.forEach(article => {
    const el = document.createElement('news-article');
    el.article = article;
    main.appendChild(el);
  });
}
