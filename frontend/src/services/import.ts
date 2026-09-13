import * as XLSX from "xlsx";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface TeacherImportRow {
  email: string;
  displayName: string;
  phone?: string;
  salaryType?: "percent" | "fixed";
  salaryPercent?: number;
  fixedRate?: number;
}

/**
 * Парсит .xlsx / .csv файл на клиенте (SheetJS)
 */
export function parseTeachersFile(file: File): Promise<TeacherImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

        const rows: TeacherImportRow[] = json.map((row) => ({
          email: String(row.email || row.Email || row["Электронная почта"] || "").trim(),
          displayName: String(row.displayName || row.name || row["ФИО"] || row["Имя"] || "").trim(),
          phone: String(row.phone || row.Phone || row["Телефон"] || "").trim() || undefined,
          salaryType: (row.salaryType || row["Тип зарплаты"] || "percent") as "percent" | "fixed",
          salaryPercent: Number(row.salaryPercent || row["Процент"] || 30) || 30,
          fixedRate: Number(row.fixedRate || row["Фикс"] || 0) || undefined,
        }));

        resolve(rows.filter((r) => r.email && r.displayName));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Отправляет массив на Cloud Function
 */
export async function importTeachers(teachers: TeacherImportRow[]) {
  const fn = httpsCallable(functions, "importTeachers");
  const result = await fn({ teachers });
  return result.data as {
    total: number;
    success: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: string; uid?: string }>;
  };
}

/**
 * Генерирует и скачивает CSV-шаблон
 */
export function downloadTeachersTemplate() {
  const csv = [
    "email,displayName,phone,salaryType,salaryPercent,fixedRate",
    "teacher1@example.com,Иванов Иван,+998901234567,percent,30,",
    "teacher2@example.com,Петрова Анна,+998907654321,fixed,,500000",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teachers-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}