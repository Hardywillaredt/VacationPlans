# VacationPlans

This repository publishes the Mount Rainier / surroundings itinerary as a GitHub Pages site and uses GitHub-native forms for structured feedback.

## Site layout

- `docs/index.html`: published trip page
- `docs/feedback.js`: client-side feedback links and synced feedback rendering
- `docs/data/feedback.json`: generated feedback snapshot for the page

## Feedback model

- General comments: GitHub issue form `general-comment.yml`
- Day-specific comments: GitHub issue form `day-feedback.yml`
- Lodging / availability updates: GitHub issue form `lodging-update.yml`
- Reactions on submitted issues can act as the first-pass up/down signal

## GitHub setup still required

1. Push this repository to GitHub.
2. In repository settings, enable GitHub Pages from the `main` branch and the `/docs` folder.
3. Enable GitHub Discussions if you want a discussion board or a `giscus`-style comment surface later.
4. Ensure GitHub Actions has permission to write contents so `feedback-sync.yml` can refresh `docs/data/feedback.json`.

## Notes

- The page is fully static and can be served directly by GitHub Pages.
- The feedback sync workflow does not parse issue forms into a rich schema yet; it snapshots issue metadata and excerpts into JSON for lightweight display on the page.
