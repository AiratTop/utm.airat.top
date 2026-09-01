# utm.airat.top

[![utm.airat.top](https://repository-images.githubusercontent.com/1148110416/0906ee16-28d3-45ef-a6a7-7ca976063d52)](https://utm.airat.top/)

[![utm.airat.top](https://raw.githubusercontent.com/AiratTop/utm.airat.top/main/public_html/screenshot.png)](https://utm.airat.top/)

Static, privacy-first UTM generator for building campaign URLs directly in the browser. Deployed as static assets on Cloudflare Workers.

- Live site: https://utm.airat.top
- Status page: https://status.airat.top

## Advantages

- Fully local generation; no data ever leaves the browser.
- Stores only local settings (no analytics, no tracking).
- One-click copy for full URLs and UTM tags.
- Presets for popular platforms (Yandex, Google, VK, YouTube, Telegram, Social, Partner, Email, Banner).
- Mobile-first layout that scales to desktop.
- Offline-friendly static files for easy hosting.

## What is inside

- `public_html/index.html` — layout and metadata.
- `public_html/styles.css` — theme, layout, and animations.
- `public_html/app.js` — generator logic and UI wiring.
- `wrangler.jsonc` — Cloudflare Worker and static asset configuration.

## Deployment

Cloudflare Workers Builds deploys the contents of `public_html` as static assets. The project has no build step; deployment uses `npx wrangler deploy` with the settings in `wrangler.jsonc`.

## License

The original source code, configuration, and documentation in this repository are licensed under
the [Apache License 2.0](LICENSE), with copyright details in [NOTICE](NOTICE).

---

## Author

**AiratTop (Airat Halitov)**

- Website: [airat.top](https://airat.top)
- GitHub: [@AiratTop](https://github.com/AiratTop)
- Email: [mail@airat.top](mailto:mail@airat.top)
- Repository: [utm.airat.top](https://github.com/AiratTop/utm.airat.top)
