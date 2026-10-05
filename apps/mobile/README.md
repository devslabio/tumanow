# TumaNow mobile

One Flutter app for **customers** and **riders**. After login, the UI switches by role (`driverId` → rider jobs shell, otherwise customer shell).

```bash
# API on 3345
cd apps/mobile
flutter run --dart-define=API_BASE=http://127.0.0.1:3345/v1
```

| Role | Login | Password | Lands on |
|------|--------|----------|----------|
| Customer | `customer` | `demo1234` | Home / shipments |
| Rider | `rider` | `demo1234` | Jobs / history |
