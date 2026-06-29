# Push NFA to GitHub

Your code is committed **locally** on branch `main`. It is not on GitHub until you complete the steps below.

## Step 1 — Create the repository on GitHub (required once)

1. Open: **https://github.com/new**
2. **Repository name:** `Nfa` (must match exactly)
3. **Owner:** `Manjith-NG`
4. Leave it **empty** — do **not** add README, .gitignore, or license (you already have code locally)
5. Click **Create repository**

## Step 2 — Push from your PC

Open PowerShell in this folder:

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
.\scripts\push-github.ps1
```

Or manually:

```powershell
cd "c:\desktop\GCU\IIPC\NFA new"
git add -A
git commit -m "Update project files"   # only if there are changes
git push -u origin main
```

When Windows asks you to sign in:

- Choose **Sign in with your browser**, or  
- Use a **Personal Access Token** as the password  
  - Create at: https://github.com/settings/tokens  
  - Enable scope: **repo**

## Step 3 — Verify

Open: **https://github.com/Manjith-NG/Nfa**

You should see all project files (README, `src/`, `prisma/`, etc.).

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `Repository not found` | Create the repo in Step 1 (exact name `Nfa`) |
| `Authentication failed` | Sign in again via Git Credential Manager or use a PAT |
| `failed to push — rejected` | Remote has commits: run `git pull origin main --rebase` then push again |
| `remote origin already exists` | Remote is fine; just run `git push -u origin main` |

Remote URL (already configured):

```
https://github.com/Manjith-NG/Nfa.git
```
