# Firestore Data Model (NoSQL)

## Коллекции верхнего уровня

### `users/{userId}`
```ts
{
  uid: string;                    // = documentId = Auth UID
  email: string;
  displayName: string;
  role: "director" | "manager" | "teacher" | "student";
  phone?: string;
  photoURL?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // teacher-only
  salaryType?: "percent" | "fixed";
  salaryPercent?: number;         // 0–100
  fixedRate?: number;
  teacherGroups?: string[];       // денормализация

  // student-only
  parentName?: string;
  parentPhone?: string;
  studentGroups?: string[];
}
```

### `groups/{groupId}`
```ts
{
  name: string;
  description?: string;
  level?: string;
  teacherId: string;              // основной
  teacherIds: string[];
  studentIds: string[];
  schedule: Array<{
    dayOfWeek: number;            // 1–7 (Пн–Вс)
    startTime: string;            // "18:00"
    endTime: string;              // "19:30"
    room?: string;
  }>;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
}
```

### `lessons/{lessonId}`
```ts
{
  groupId: string;
  teacherId: string;
  date: Timestamp;
  startTime: Timestamp;
  endTime: Timestamp;             // ← используется для таймера 1 часа
  topic?: string;
  homework?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  reportSubmitted: boolean;
  reportSubmittedAt?: Timestamp;
  qrSessionId?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `lessons/{lessonId}/attendance/{studentId}`  (subcollection)
```ts
{
  studentId: string;
  status: "pending" | "present" | "absent" | "excused";
  scannedAt?: Timestamp;
  confirmedBy?: string;
  confirmedAt?: Timestamp;
  note?: string;
  deviceInfo?: string;
}
```

### `qrSessions/{sessionId}`
```ts
{
  lessonId: string;
  teacherId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;           // обычно +10 минут
  usedBy: string[];               // studentIds
  maxUses: number;
  isActive: boolean;
  signature?: string;             // опционально HMAC
}
```

### `reports/{reportId}`
```ts
{
  lessonId: string;
  teacherId: string;
  groupId: string;
  topic: string;
  homework: string;
  attendanceSummary: {
    present: number;
    absent: number;
    excused: number;
    total: number;
  };
  submittedAt: Timestamp;
  isLate: boolean;
  notes?: string;
}
```

### `payments/{paymentId}`
```ts
{
  studentId: string;
  groupId?: string;
  amount: number;
  currency: string;
  type: "tuition" | "other";
  period: string;                 // "2026-09"
  paidAt: Timestamp;
  method?: string;
  createdBy: string;
  relatedLessonIds?: string[];
}
```

### `notifications/{notificationId}`
```ts
{
  toUserIds: string[];
  toRoles?: string[];
  type: "late_report" | "system" | "payment" | "info";
  title: string;
  body: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

### `salaryCalculations/{calcId}` (опционально)
```ts
{
  teacherId: string;
  period: string;
  lessonsCount: number;
  studentsCount: number;
  amount: number;
  calculatedAt: Timestamp;
  calculatedBy: string;
}
```

## Рекомендуемые Composite Indexes

- `lessons`: teacherId + date DESC
- `lessons`: groupId + date DESC
- `lessons`: status + endTime ASC
- `lessons`: reportSubmitted + endTime ASC
- `notifications`: toUserIds (array) + isRead + createdAt DESC
- `qrSessions`: isActive + expiresAt

## Денормализация

- `users.teacherGroups` / `users.studentGroups` — для быстрых запросов «мои группы»
- `groups.studentIds` / `groups.teacherIds` — чтобы не делать join
- `attendance` как subcollection урока — идеальная локальность данных