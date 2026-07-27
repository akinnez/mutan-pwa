import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "../../../components/shared/LoadingSpinner";
import useVerifyPayments from "../../../hooks/useVerifyPayments";
import { useEffect } from "react";

export default function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const verify = useVerifyPayments();

  useEffect(() => {
    const reference = params.get("reference");

    if (!reference) {
      router.replace("/payments");
      return;
    }

    verify.mutate(reference);
  }, []);
  return <LoadingSpinner />;
}
