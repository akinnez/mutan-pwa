"use client";
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "../../../components/shared/LoadingSpinner";
import useVerifyPayments from "../../../hooks/useVerifyPayments";
import { Suspense, useEffect } from "react";

function CallbackPage() {
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

export default function Callback() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackPage />
    </Suspense>
  );
}
