import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Korean football backrooms game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html[^>]+lang="ko"/i);
  assert.match(html, /<title>정선 FC: 90분의 백룸<\/title>/i);
  assert.match(html, /정선 FC/);
  assert.match(html, /90분의 백룸/);
  assert.match(html, /게임 시작/);
  assert.match(html, /라민 야말/);
  assert.match(html, /손흥민/);
  assert.match(html, /팬메이드 게임 콘셉트/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/i);
});

test("ships the complete ten-room difficulty curve and local character assets", async () => {
  const [game, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  for (const name of [
    "라민 야말", "엘링 홀란", "크리스티아누 호날두", "손흥민", "네이마르 주니오르",
    "해리 케인", "에밀리아노 마르티네스", "리오넬 메시", "비니시우스 주니오르", "주드 벨링엄",
  ]) {
    assert.match(game, new RegExp(name));
  }
  for (const mechanic of ["kickBall", "recallBall", "chaserSpeed", "chaserDelay", "targetRadius", "difficulty", "shadowDefeated", "그림자 심판이 이 방에서 퇴장", "targetProgress", "mobile-controls", "gameOver", "ending"]) {
    assert.match(game, new RegExp(mechanic));
  }
  assert.match(page, /import Game from "\.\/Game"/);
  assert.match(layout, /<html lang="ko">/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  const assets = [
    "hero.png", "hero-game.png", "lamine-yamal.png", "erling-haaland.png",
    "cristiano-ronaldo.png", "son-heung-min.png", "neymar-jr.png", "harry-kane.png",
    "emiliano-martinez.png", "lionel-messi.png", "vinicius-junior.png", "jude-bellingham.png",
  ];
  const newTransparentAssets = new Set([
    "harry-kane.png", "emiliano-martinez.png", "lionel-messi.png", "vinicius-junior.png", "jude-bellingham.png",
  ]);
  for (const filename of assets) {
    const file = new URL(`../public/assets/characters/${filename}`, import.meta.url);
    await access(file);
    assert.ok((await stat(file)).size > 100_000, `${filename} should be a real image asset`);
    if (newTransparentAssets.has(filename)) {
      const png = await readFile(file);
      assert.equal(png[25], 6, `${filename} should use RGBA transparency`);
    }
  }
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/_sites-preview/preview.css", import.meta.url)));
  assert.equal(new URL("./", root).pathname, root.pathname);
});
