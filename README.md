This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<br>

---

<br>

## このアプリについて

このプロジェクトは技術記事のブックマークWebアプリ開発です。

具体的には、以下の機能があります。

- URLを貼るだけ: 気になった技術記事（Zenn, Qiita, 海外公式ドキュメント等）のURLを入力する。

- 自動メタデータ取得: Next.jsのサーバーサイド機能（API Route）を使って、その記事のタイトル、画像（OGP）、概要を自動でスクレイピングして保存する。

- タグ付け・分類: 「Java」「React」「アルゴリズム」などのタグを付けて管理する。

### 使用技術 / Tech Stack

本プロジェクトでは、スケーラビリティと開発効率を重視し、以下のモダンなスタックを採用しています。

- **Frontend**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend/BaaS**: Supabase
- **State Management**: React Hooks

### 設計のポイント

- App Router を活用したサーバーサイドレンダリングとデータ取得の最適化。
- TypeScript による厳密な型定義。
