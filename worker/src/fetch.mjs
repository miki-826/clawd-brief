import fs from 'node:fs/promises';
import path from 'node:path';
import Parser from 'rss-parser';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '../../');
const OUT_DIR = path.join(ROOT, 'web', 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'digest.json');
const FEEDS_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'feeds.json');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'clawd-brief/1.0 (+https://github.com/miki-826/clawd-brief)'
  }
});

function normUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.toString();
  } catch {
    return u;
  }
}

function pickDate(item) {
  const candidates = [item.isoDate, item.pubDate, item.published, item.updated];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text, max = 220) {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

async function loadFeeds() {
  const raw = await fs.readFile(FEEDS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function fetchFeed(feed) {
  const data = await parser.parseURL(feed.url);
  const items = (data.items ?? []).map((it) => {
    const date = pickDate(it);
    return {
      id: `${feed.name}::${normUrl(it.link ?? it.guid ?? it.title ?? Math.random())}`,
      title: it.title ?? '(no title)',
      url: normUrl(it.link ?? ''),
      source: feed.name,
      category: feed.category,
      date: date ? date.toISOString() : null,
      summary: summarize(it.contentSnippet ?? it.content ?? it.summary ?? ''),
      raw: {
        guid: it.guid ?? null,
        creator: it.creator ?? null
      }
    };
  });

  return {
    name: feed.name,
    url: feed.url,
    category: feed.category,
    title: data.title ?? feed.name,
    items
  };
}

async function main() {
  const feeds = await loadFeeds();

  const results = [];
  for (const feed of feeds) {
    try {
      results.push(await fetchFeed(feed));
      // polite pacing
      await new Promise((r) => setTimeout(r, 350));
    } catch (e) {
      results.push({
        name: feed.name,
        url: feed.url,
        category: feed.category,
        title: feed.name,
        error: String(e?.message ?? e)
      });
    }
  }

  const flatItems = results
    .flatMap((r) => (r.items ?? []))
    .filter((x) => x.url && x.title)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 160);

  const out = {
    generatedAt: new Date().toISOString(),
    timezone: 'Asia/Tokyo',
    feeds: results.map((r) => ({
      name: r.name,
      url: r.url,
      category: r.category,
      title: r.title,
      error: r.error ?? null
    })),
    items: flatItems
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');

  console.log(`Wrote ${flatItems.length} items -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
