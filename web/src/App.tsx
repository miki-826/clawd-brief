import { useEffect, useMemo, useState } from 'react'

type DigestFeed = {
  name: string
  url: string
  category: string
  title: string
  error: string | null
}

type DigestItem = {
  id: string
  title: string
  url: string
  source: string
  category: string
  date: string | null
  summary: string
}

type Digest = {
  generatedAt: string | null
  timezone: string
  feeds: DigestFeed[]
  items: DigestItem[]
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ja-JP', { hour12: false })
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('cb:dark')
    if (saved === '1') return true
    if (saved === '0') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('cb:dark', dark ? '1' : '0')
  }, [dark])

  return { dark, setDark }
}

export default function App() {
  const { dark, setDark } = useDarkMode()
  const [digest, setDigest] = useState<Digest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [source, setSource] = useState<string>('all')
  const [selected, setSelected] = useState<DigestItem | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/data/digest.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Digest
        setDigest(data)
      } catch (e: any) {
        setError(String(e?.message ?? e))
      }
    })()
  }, [])

  const categories = useMemo(() => {
    const set = new Set((digest?.items ?? []).map((i) => i.category).filter(Boolean))
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [digest])

  const sources = useMemo(() => {
    const set = new Set((digest?.items ?? []).map((i) => i.source).filter(Boolean))
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [digest])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (digest?.items ?? []).filter((i) => {
      if (category !== 'all' && i.category !== category) return false
      if (source !== 'all' && i.source !== source) return false
      if (!q) return true
      return (
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q)
      )
    })
  }, [digest, query, category, source])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Clawd Brief</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 dark:text-slate-400">AI・IT ニュースダイジェスト</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              今日のトップニュース
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              生成: {digest?.generatedAt ? formatDate(digest.generatedAt) : '—'}
              {digest?.timezone ? `（${digest.timezone}）` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow dark:border-white/10 dark:bg-white/5"
              aria-label="toggle dark mode"
              title="テーマ切替"
            >
              {dark ? 'Light' : 'Dark'}
            </button>
            <a
              href="https://github.com/miki-826/clawd-brief"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow dark:border-white/10 dark:bg-white/5"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </header>

        <section className="mt-6 grid gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <label className="text-xs text-slate-600 dark:text-slate-300">検索</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワード（例: OpenAI / GPU / iOS）"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-slate-600 dark:text-slate-300">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-white/5"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'すべて' : c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-slate-600 dark:text-slate-300">ソース</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/30 transition focus:ring-4 dark:border-white/10 dark:bg-white/5"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'すべて' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-12 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">
              表示: {filtered.length}
            </span>
            {error ? (
              <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                読み込みエラー: {error}
              </span>
            ) : null}
          </div>
        </section>

        <main className="mt-6 grid gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              該当する記事がありません。フィルタを変えるか、ワーカーで新しい digest を生成してください。
            </div>
          ) : (
            filtered.map((item) => (
              <article
                key={item.id}
                className="group rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold leading-snug tracking-tight">
                      <button
                        onClick={() => setSelected(item)}
                        className="text-left underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </button>
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {item.summary || '—'}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:shadow dark:border-white/10 dark:bg-white/5"
                    title="元記事を開く"
                  >
                    Open
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                    {item.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">
                    {item.source}
                  </span>
                  {item.date ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">
                      {formatDate(item.date)}
                    </span>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </main>

        <footer className="mt-10 border-t border-slate-200/70 pt-6 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          <p>
            注意: 本アプリは RSS を収集して一覧化します。記事本文は各サイトの利用規約に従って閲覧してください。
          </p>
        </footer>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold leading-snug">{selected.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                    {selected.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">
                    {selected.source}
                  </span>
                  {selected.date ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-white/10">
                      {formatDate(selected.date)}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:shadow dark:border-white/10 dark:bg-white/5"
              >
                閉じる
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
              {selected.summary || '—'}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className={classNames(
                  'rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition',
                  'hover:bg-indigo-500'
                )}
              >
                元記事を開く
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(selected.url)
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition hover:shadow dark:border-white/10 dark:bg-white/5"
              >
                URLをコピー
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
