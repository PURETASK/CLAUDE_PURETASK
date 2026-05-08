self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'PureTask', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'PureTask', {
      body: payload.body ?? '',
      icon: '/favicon.ico',
      data: { url: payload.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
