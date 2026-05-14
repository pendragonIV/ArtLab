# ArtLab

Monorepo: **Next.js** (UI) + **ASP.NET Core** (API, EF Core, PostgreSQL).

| Thư mục | Vai trò |
|---------|---------|
| [`frontend-nextjs/`](frontend-nextjs/) | Giao diện Next.js 16 — dev, build, **lint**: xem [frontend-nextjs/README.md](frontend-nextjs/README.md) |
| `backend-dotnet/` | REST API, auth, dữ liệu |

## Frontend — kiểm tra nhanh

```bash
cd frontend-nextjs
npm install
npm run lint
npm run build
```

Chi tiết script, lint baseline và cấu trúc `src/` nằm trong [frontend-nextjs/README.md](frontend-nextjs/README.md).

## Remote (GitLab)

```bash
git remote add origin https://gitlab.com/pendragonIV/artlab.git
git branch -M main
git push -uf origin main
```
