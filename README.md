# The True Cost of Fast Fashion — static site

Interactive D3.js visualization with dataset in `data/`.

## Deploy to GitHub Pages

### 1. Create a new empty repository

On GitHub: [Create a new repository](https://github.com/new) (no README, no .gitignore, no license — keep it empty so your first push is clean).

### 2. Push this project from your machine

This repo is already initialized on `main` with an initial commit. From this folder:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin <url>` instead.

**Note:** Creating the empty GitHub repository must be done in the browser (or with the GitHub CLI) before `git push` will succeed.

### 3. Enable GitHub Pages

In the repo on GitHub: **Settings** → **Pages** → **Build and deployment**:

- Source: **Deploy from a branch**
- Branch: **main** / **/ (root)**

Save and wait for the green check / “Your site is live at …” URL (often `https://<username>.github.io/<repo>/`).

### 4. Verify

- Open the Pages URL and confirm the chart loads (not the “Could not load CSV” message).
- Open **Documentation** and return to **Visualization**.

### Local preview (optional)

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/` (CSV fetch needs HTTP, not `file://`).
