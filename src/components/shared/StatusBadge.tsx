import { statusBadge } from "../../lib/utils/format";
export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(status)}`}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
