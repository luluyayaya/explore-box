/* 探索盲盒 Service Worker
   更新方式：修改 VERSION 字符串 → 推送 → 用户下次打开自动获取新版本 */
const VERSION = 'v1';
const CACHE = 'explore-box-' + VERSION;

const PRECACHE = [
  '/explore-box/',
  '/explore-box/index.html',
  '/explore-box/manifest.json',
  '/explore-box/icon-192.png',
  '/explore-box/icon-180.png',
];

/* 安装：预缓存核心文件 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting(); // 立即激活，不等标签页关闭
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // 立即接管所有页面
});

/* 请求策略：网络优先，离线时用缓存兜底 */
self.addEventListener('fetch', e => {
  /* 只处理同源请求 */
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        /* 网络成功：更新缓存 */
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) /* 离线：用缓存 */
  );
});
