import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memberApi } from "../lib/api/member";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PaymentSession } from "../lib/payment/payment_session";

export default function useVerifyPayment() {
  const qc = useQueryClient();
  const router = useRouter();

  const verifyMutation = useMutation({
    mutationFn: memberApi.verifyPaystack,
    onSuccess: () => {
      PaymentSession.clear();
      qc.invalidateQueries({
        queryKey: ["dashboard", "transactions"],
      });

      toast.success("Payment successful");

      router.replace("/savings");
    },
    onError: (error: Error, variables: string) => {
      console.log(error, variables);
    },
  });
  return verifyMutation;
}
