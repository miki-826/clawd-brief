# Clawd Brief

RSS から AI・IT ニュースを集約して「今日のトップニュース」として読むための、軽量なダイジェスト・ビューアです。

- 収集（Node ワーカー）: `worker/` が RSS を取得し `web/public/data/digest.json` を生成
- 表示（Web）: `web/` が `digest.json` を読み込み、検索・カテゴリ/ソース絞り込み・モーダル表示
- GitHub Actions:
  - 毎日 **06:00 JST** に digest を自動更新（コミット）
  - `main` への push で GitHub Pages に自動デプロイ

## 使い方（ローカル）

```bash
npm install
npm run fetch     # RSS 取得 → digest.json 生成
npm run dev       # Web 起動
```

## フィードの追加

`worker/src/feeds.json` を編集してください。

```json
{"name":"OpenAI","url":"https://openai.com/blog/rss.xml","category":"AI"}
```

## デプロイ（GitHub Pages）

`Settings → Pages` で **GitHub Actions** を選ぶと、`Deploy Pages` ワークフローで配信されます。

## 注意

本リポジトリは RSS を収集して一覧化します。記事本文の利用・転載は禁止等は各サイトの利用規約に従ってください。
