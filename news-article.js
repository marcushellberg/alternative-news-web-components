import { html, render } from './node_modules/lit-html/lit-html.js';

customElements.define(
  'news-article',
  class extends HTMLElement {
    constructor() {
      super();
      this.root = this.attachShadow({ mode: 'open' });
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
    }
    set article(article) {
      render(this.template(article), this.root);
    }
  }
);
