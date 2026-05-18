"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./page.module.css";

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Processing payment verification...");

  useEffect(() => {
    // Collect all query params to send to backend
    const queryString = searchParams.toString();
    if (!queryString) {
      setStatus("failed");
      setMessage("Invalid payment request.");
      return;
    }

    // For manual bank transfer redirect
    if (searchParams.get("method") === "bank" && searchParams.get("status") === "pending") {
      setStatus("success");
      setMessage("Please complete your bank transfer using the instructions below. Your order will be activated shortly after verification.");
      return;
    }

    // For VNPay return
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/checkout/vnpay-return?${queryString}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          setMessage("Your payment was successful! You can now start learning.");
        } else {
          const err = await res.json();
          setStatus("failed");
          setMessage(err.message || "Payment verification failed. Please contact support.");
        }
      })
      .catch((err) => {
        setStatus("failed");
        setMessage("Network error occurred during payment verification.");
      });
  }, [searchParams]);

  return (
    <div className={styles.card}>
      {status === "loading" && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <h2 className={styles.title}>Verifying Payment...</h2>
          <p className={styles.desc}>{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className={styles.success}>
          <CheckCircle size={64} color="#34d399" className={styles.icon} />
          <h2 className={styles.title}>Payment Successful!</h2>
          <p className={styles.desc}>{message}</p>
          
          {searchParams.get("method") === "bank" && (
            <div className={styles.bankInstructions}>
              <h3 className={styles.bankTitle}>Bank Transfer Details</h3>
              <p className={styles.bankDesc}><strong>Bank:</strong> {process.env.NEXT_PUBLIC_BANK_NAME || "Vietcombank"}</p>
              <p className={styles.bankDesc}><strong>Account Name:</strong> {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "ARTLAB ACADEMY"}</p>
              <p className={styles.bankDesc}><strong>Account Number:</strong> {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "—"}</p>
              <p className={`${styles.bankDesc} ${styles.highlight}`}><strong>Transfer Content:</strong> ARTLAB {searchParams.get("orderId")}</p>
            </div>
          )}

          <Link href="/my-courses" className={styles.btnPrimary}>
            Go to My Courses
          </Link>
        </div>
      )}

      {status === "failed" && (
        <div className={styles.failed}>
          <XCircle size={64} color="#ef4444" className={styles.icon} />
          <h2 className={styles.title}>Payment Failed</h2>
          <p className={styles.desc}>{message}</p>
          <Link href="/cart" className={styles.btnSecondary}>
            Back to Cart
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <Suspense fallback={
          <div className={styles.card}>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <h2 className={styles.title}>Loading...</h2>
            </div>
          </div>
        }>
          <PaymentReturnContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
