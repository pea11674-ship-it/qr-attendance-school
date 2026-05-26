export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "PENDING_REVIEW";

export const statusLabel: Record<AttendanceStatus, string> = {
  PRESENT: "มาเรียน",
  LATE: "มาสาย",
  ABSENT: "ขาดเรียน",
  LEAVE: "ลา",
  PENDING_REVIEW: "รอการตรวจสอบ"
};

export const statusTone: Record<AttendanceStatus, string> = {
  PRESENT: "good",
  LATE: "warn",
  ABSENT: "bad",
  LEAVE: "info",
  PENDING_REVIEW: "muted"
};

export function toAttendanceStatus(status: string): AttendanceStatus {
  if (status in statusLabel) return status as AttendanceStatus;
  return "PENDING_REVIEW";
}

export function getStatusLabel(status: string) {
  return statusLabel[toAttendanceStatus(status)];
}

export function getStatusTone(status: string) {
  return statusTone[toAttendanceStatus(status)];
}
