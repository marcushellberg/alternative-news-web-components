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
