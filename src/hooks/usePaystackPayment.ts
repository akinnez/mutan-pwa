import { useMutation } from "@tanstack/react-query";
import { memberApi } from "../lib/api/member";
import toast from "react-hot-toast";
import { useState } from "react";
import { PaymentSession } from "../lib/payment/payment_session";

export default function usePaystackPayment(setPayDirectForm:any) {
  const [confirmingPayDirect, setConfirmingPayDirect] = useState(false);
  const [showPayDirect, setShowPayDirect] = useState(false);

  const { isPending:isPaystackPending, mutate:paystackMutate } = useMutation({
    mutationFn: memberApi.initializePaystack,
    onSuccess: (res, variables:any) => {
      const data = res.data?.data ?? res.data;
      const { authorization_url, reference } = data;

       PaymentSession.save({
        reference,
        amount: variables.amount,
        payment_type: variables.payment_type,
      });

      if (!authorization_url) {
        toast.error("Could not get payment link — please try again.");
        setConfirmingPayDirect(false);
        return;
      }
      // Backend already initialized with Paystack — open their hosted
      // payment page. The webhook handles the result automatically;
      // no manual verify call needed from the frontend.
      setShowPayDirect(false);
      setConfirmingPayDirect(false);
      setPayDirectForm({
        payment_type: "subscription_payment",
        amount: "",
        is_directed: false,
        target_scheme_id: "",
        target_loan_id: "",
      });
      toast.success("Opening payment page…");
      window.location.assign(authorization_url);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Could not start payment");
      setConfirmingPayDirect(false);
    },
  });

  return {
    isPaystackPending,
    confirmingPayDirect,
    showPayDirect,
    paystackMutate,
    setConfirmingPayDirect,
    setShowPayDirect,
  };
}
