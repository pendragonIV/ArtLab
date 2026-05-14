# ArtLab — frontend (Next.js)

UI của ArtLab: **Next.js 16**, **React 19**, TypeScript strict, **NextAuth**, ESLint (`eslint-config-next`).

## Yêu cầu

- Node.js (khuyến nghị LTS, tương thích với Next 16)
- npm (hoặc pnpm/yarn nếu bạn cấu hình tương đương)

## Cài đặt

```bash
npm install
```

## Lệnh thường dùng

| Lệnh | Mục đích |
|------|----------|
| `npm run dev` | Dev server: [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build sau `npm run build` |
| `npm run lint` | ESLint toàn project (`src/`) — **nên chạy trước khi mở PR** |

## Kiểm tra chất lượng (lint)

Chạy từ thư mục này:

```bash
npm run lint
```

**Baseline hiện tại:** `npm run lint` vẫn **chưa pass** (nhiều errors, chủ yếu TypeScript strict và React hooks). Chạy lệnh trên để xem danh sách và số liệu cập nhật. Các rule hay gặp:

- `@typescript-eslint/no-explicit-any` — tránh `any`, khai báo kiểu rõ
- `@typescript-eslint/ban-ts-comment` — ưu tiên `@ts-expect-error` thay cho `@ts-ignore`
- `react-hooks/set-state-in-effect` / `exhaustive-deps` — pattern `useEffect` và dependency array
- `react/no-unescaped-entities` — ký tự nháy trong JSX
- `@next/next/no-img-element` — ưu tiên `next/image` khi phù hợp

Mục tiêu: `npm run lint` thoát mã **0** trên CI và máy local trước khi merge.

## Cấu trúc gợi ý

- `src/app/` — App Router (trang, layout, API routes)
- `src/components/` — component dùng chung
- `src/contexts/`, `src/lib/` — context, HTTP, i18n, v.v.

## Backend

API và auth JWT do **ASP.NET** (thư mục `backend-dotnet/` ở root repo). Biến môi trường và URL API — xem quy tắc dự án trong `.cursor/rules/` (frontend env / endpoints).
