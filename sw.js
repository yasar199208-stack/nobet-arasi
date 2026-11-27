self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {});

// Bildirim (uygulama kapalıyken gelen push). Uygulama ekranda açıksa bildirim göstermez, uygulama kendi sesini çalar.
self.addEventListener("push", function (e) {
  var j = {};
  try { j = e.data ? e.data.json() : {}; } catch (x) { j = {}; }
  var d = j.data || j.notification || j || {};
  var title = String(d.title || "Nöbet Arası");
  var body = String(d.body || "");
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].visibilityState === "visible" && list[i].focused) return;
      }
      return self.registration.showNotification(title, {
        body: body,
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: String(d.tag || "na"),
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: String(d.url || "./") }
      });
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
