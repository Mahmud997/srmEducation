# Security Rules — объяснение

## Подход

1. Роль хранится в документе `users/{uid}.role`.
2. Дополнительно рекомендуется ставить **Custom Claims** (`auth.setCustomUserClaims`) — тогда можно проверять `request.auth.token.role` без чтения документа (быстрее и дешевле).
3. Критические операции (QR, импорт, подтверждение attendance) выполняются **только через Callable Cloud Functions** (Admin SDK обходит rules).

## Матрица доступа (упрощённо)

| Ресурс              | Director | Manager | Teacher          | Student      |
|---------------------|----------|---------|------------------|--------------|
| users               | CRUD     | R + C   | R (свой)         | R (свой)     |
| groups              | CRUD     | CRUD    | R (свои)         | R (свои)     |
| lessons             | CRUD     | CRUD    | CRU (свои)       | R            |
| attendance          | CRUD     | CRUD    | RU (свои уроки)  | R (свой)     |
| qrSessions          | —        | —       | через Functions  | через Fn     |
| reports             | CRUD     | R       | C (свои)         | —            |
| payments            | CRUD     | CRUD    | —                | R (свои)     |
| notifications       | CRUD     | R       | R (свои)         | R (свои)     |

## Рекомендации

- После смены роли всегда обновляйте Custom Claims.
- Для production добавьте App Check.
- Логируйте все Callable Functions.