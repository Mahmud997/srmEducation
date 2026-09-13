import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function createQrSession(lessonId: string) {
  const fn = httpsCallable(functions, "createQrSession");
  const result = await fn({ lessonId });
  return result.data as {
    sessionId: string;
    expiresAt: string;
    qrPayload: string;
  };
}

export async function scanAttendance(sessionId: string) {
  const fn = httpsCallable(functions, "scanAttendance");
  const result = await fn({ sessionId });
  return result.data as { success: boolean; status: string };
}