import { getStatusLabel, getStatusTone } from "@/lib/status";

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${getStatusTone(status)}`}>{getStatusLabel(status)}</span>;
}
