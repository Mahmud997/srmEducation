# Firebase CRM / LMS — Учебный центр

Полноценный serverless-стартер для CRM/LMS учебного центра.  
Frontend → GitHub Pages (React / Vue / Vanilla).  
Backend → **только Firebase** (Auth, Firestore, Cloud Functions, Storage, Pub/Sub).

## Что внутри

```
firebase-crm-lms/
├── docs/
│   ├── firestore-data-model.md      # Полная NoSQL-модель
│   ├── security-rules-explained.md  # Объяснение правил
│   └── qr-and-timer-logic.md        # QR + 1-часовой таймер
├── firestore.rules                  # Готовые Security Rules
├── firestore.indexes.json           # Индексы
├── functions/                       # Cloud Functions (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── qr.ts
│       ├── reports.ts
│       ├── importTeachers.ts
│       └── utils.ts
├── frontend/                        # Пример React + Vite + Firebase
│   ├── package.json
│   ├── src/
│   │   ├── services/firebase.ts
│   │   ├── services/qr.ts
│   │   ├── services/import.ts
│   │   ├── hooks/useAuth.ts
│   │   └── components/...
│   └── ...
├── templates/
│   └── teachers-import-template.csv # Шаблон для импорта
└── firebase.json
```

## Быстрый старт

1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Включите: Authentication (Email/Password + Google), Firestore, Functions, Storage
3. Установите Firebase CLI: `npm i -g firebase-tools`
4. `firebase login` → `firebase use <project-id>`
5. Скопируйте `.env.example` → `.env` и заполните
6. Разверните правила и функции:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```
7. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Роли

| Роль       | Права |
|------------|-------|
| `director` | Всё + импорт + зарплата + аналитика |
| `manager`  | Группы, ученики, расписание, отчёты |
| `teacher`  | Свои группы, уроки, посещаемость, отчёты |
| `student`  | Только сканирование QR и просмотр своих данных |

Роль хранится в Custom Claims + в документе `users/{uid}.role`.

## Основные сценарии

- **QR-посещаемость**: учитель генерирует временный QR → ученики сканируют → статус `pending` → учитель подтверждает.
- **Контроль отчётов**: через 60 минут после `endTime` урока Cloud Function создаёт уведомление директору/менеджерам.
- **Импорт учителей**: клиент парсит Excel/CSV (SheetJS) → Callable Function создаёт Auth + документы.

---

Сделано как production-ready foundation. Можно сразу деплоить и дорабатывать UI.