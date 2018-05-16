import './news-article.js';
const apiKey = '7f65a98cdbf1496088f8cb61e23fd2e8';

window.addEventListener('load', () => {
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
  const sourceSelector = document.querySelector('#sources');
  const response = await fetch(
    `https://newsapi.org/v2/sources?apiKey=${apiKey}`
  );
  const json = await response.json();
  sourceSelector.innerHTML = json.sources
    .map(source => `<option value="${source.id}">${source.name}</option>`)
    .join('\n');

  sourceSelector.addEventListener('change', evt =>
    fetchArticles(evt.target.value)
  );
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
