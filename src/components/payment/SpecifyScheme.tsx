import { useQuery } from "@tanstack/react-query";
import { memberApi } from "../../lib/api/member";

export interface ISpecifyScheme {
  value_target: string;
  setValueForm: React.Dispatch<React.SetStateAction<any>>;
  showPayment: boolean;
}

export default function SpecifyScheme({
  setValueForm,
  showPayment,
  value_target,
}: ISpecifyScheme) {
  const { data: schemesData } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => memberApi.getSchemes(),
    enabled: showPayment,
  });
  const schemes = schemesData?.data?.data ?? schemesData?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium">
          Direct to specific scheme?
        </label>
      </div>
      <select
        value={value_target}
        onChange={(e) =>
          setValueForm((f: any) => ({
            ...f,
            target_scheme_id: e.target.value,
          }))
        }
        className="input-field"
      >
        <option value="">Select scheme…</option>
        {schemes
          .filter((s: any) => !s.is_compulsory)
          .map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </select>
    </div>
  );
}
