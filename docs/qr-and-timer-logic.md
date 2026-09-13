# QR-посещаемость + Таймер 1 часа

## Поток QR

1. Учитель открывает урок → нажимает «Начать урок / Сгенерировать QR».
2. Клиент вызывает Callable Function `createQrSession({ lessonId })`.
3. Function:
   - Проверяет, что caller = teacher этого урока (или director/manager).
   - Создаёт документ `qrSessions/{sessionId}` с `expiresAt = now + 10 min`.
   - Пишет `qrSessionId` в документ урока.
   - Возвращает `{ sessionId, expiresAt, qrPayload }`.
4. На экране учителя отображается QR-код (библиотека `qrcode.react` или аналог).
5. Ученик сканирует QR → получает `sessionId`.
6. Клиент ученика вызывает `scanAttendance({ sessionId })`.
7. Function:
   - Проверяет `isActive && expiresAt > now`.
   - Проверяет, что student ещё не в `usedBy`.
   - Проверяет, что student состоит в группе урока.
   - Добавляет studentId в `usedBy`.
   - Создаёт/обновляет `lessons/{lessonId}/attendance/{studentId}` со статусом `"pending"`.
8. Учитель видит список pending → меняет статус → «Подтвердить».
9. После подтверждения можно деактивировать QR-сессию.

### Защита от скриншота / передачи

- Короткий TTL (5–15 мин).
- Один studentId = одно использование.
- Проверка принадлежности к группе.
- Желательно вызывать `scanAttendance` только из авторизованного клиента ученика.
- Можно добавить device fingerprint (лёгкий) или одноразовый nonce.

## Таймер 1 час после урока

### Вариант A (рекомендуемый для старта) — Scheduled Function

Каждые 10–15 минут запускается:

```ts
exports.checkLateReports = functions.pubsub
  .schedule("every 15 minutes")
  .timeZone("Asia/Tashkent") // или ваш
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const threshold = new admin.firestore.Timestamp(now.seconds - 3600, 0);

    const snap = await db.collection("lessons")
      .where("status", "==", "completed")
      .where("reportSubmitted", "==", false)
      .where("endTime", "<=", threshold)
      .limit(100)
      .get();

    // создаём notifications + ставим флаг isLate
  });
```

### Вариант B (более точный) — Cloud Tasks

При переводе урока в `status: "completed"` создаётся Task с delay = 60 минут.  
Если учитель успел отправить отчёт — Task отменяется (по taskName, сохранённому в документе урока).

Для большинства учебных центров Вариант A достаточен и проще в поддержке.