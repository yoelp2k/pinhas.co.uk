# Maly Pinhas occupational therapy website

A small bilingual website for Maly Pinhas's occupational therapy practice, available in English and Hebrew.

- Live site: [maly.pinhas.co.uk](https://maly.pinhas.co.uk)
- Current GitHub Pages preview: [yoelp2k.github.io/pinhas.co.uk](https://yoelp2k.github.io/pinhas.co.uk/)

The site uses plain HTML and CSS. It has no client-side JavaScript, cookies, analytics, external fonts, or runtime dependencies.

## Structure

- `index.html` — English page
- `he/index.html` — Hebrew RTL page
- `style.css` — shared responsive styles
- `en.json` and `he.json` — canonical text used by the tests
- `maly-portrait.webp` — optimized portrait with camera and location metadata removed
- `test/site.test.js` — language, structure, design, and deployment checks

The language switcher uses ordinary links, so both versions work without JavaScript and remain accessible to search engines and assistive technology.

## Work locally

Node.js 20 or newer is required for the tests.

```sh
npm test
python3 -m http.server 8000
```

Then open [localhost:8000](http://localhost:8000). The Hebrew page is at `/he/`.

When editing text, update the relevant HTML page and its matching JSON file. Run the tests before committing so the two languages, navigation, and deployment configuration remain complete.

## Deployment

Pushes to `main` run the tests and deploy the static files through GitHub Actions. Pull requests run the same tests without publishing.

GitHub Pages must use **GitHub Actions** as its source. Configure `maly.pinhas.co.uk` under **Settings → Pages → Custom domain**; the workflow does not require a repository `CNAME` file. Enable **Enforce HTTPS** after GitHub's DNS check succeeds.

For `maly.pinhas.co.uk`, use a `CNAME` to `yoelp2k.github.io`. Keep the `pinhas.co.uk` apex DNS records available for Microsoft 365 email.

## Domain safety

`my-ot.eu` is reserved for Maly's existing Microsoft 365 email service. It is not the website domain. Never change or remove its MX, SPF/verification TXT, or `autodiscover` records as part of a website deployment.

Do not add a repository `CNAME` file. The custom domain is managed in GitHub Pages settings because deployment uses GitHub Actions.
