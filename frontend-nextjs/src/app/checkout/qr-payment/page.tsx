"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Clock,
  ShieldCheck,
  Loader2,
  QrCode,
} from "lucide-react";
import styles from "./page.module.css";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5149";
const POLL_INTERVAL = 5000; // 5 giây
const QR_TIMEOUT = 15 * 60 * 1000; // 15 phút

type PaymentStatus = "waiting" | "success" | "expired" | "error";

interface QrData {
  orderId: number;
  totalVnd: number;
  totalUsd: number;
  transferContent: string;
  qrUrl: string;
  accountNumber: string;
  accountName: string;
  bankBin: string;
}

function QrPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [status, setStatus] = useState<PaymentStatus>("waiting");
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(QR_TIMEOUT);
  const [copied, setCopied] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const token = (session as any)?.backendToken;
  const couponCode = searchParams.get("coupon") ?? undefined;

  // Tạo QR order khi load trang
  useEffect(() => {
    if (!session) return;
    createQrOrder();
  }, [session]);

  // Đếm ngược thời gian QR
  useEffect(() => {
    if (status !== "waiting") return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = QR_TIMEOUT - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus("expired");
        clearAllIntervals();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [status]);

  const clearAllIntervals = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const createQrOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/checkout/qr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponCode }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Không thể tạo đơn hàng");
        setStatus("error");
        return;
      }

      const data: QrData = await res.json();
      setQrData(data);
      startPolling(data.orderId);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderId: number) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND}/api/checkout/status/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPollCount((p) => p + 1);

        if (data.paid || data.status === "Completed") {
          setStatus("success");
          clearAllIntervals();
          // Redirect tới my-courses sau 3 giây
          setTimeout(() => router.push("/my-courses"), 3000);
        }
      } catch {
        // Bỏ qua lỗi poll tạm thời
      }
    }, POLL_INTERVAL);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const bankName = (bin: string) => {
    const map: Record<string, string> = {
      "970436": "Vietcombank (VCB)",
      "970422": "MB Bank",
      "970407": "Techcombank (TCB)",
      "970405": "Agribank",
      "970415": "VietinBank (CTG)",
      "970432": "VPBank",
      "970416": "ACB",
      "970423": "TPBank",
    };
    return map[bin] ?? "Ngân hàng";
  };

  // =================== RENDER ===================

  if (loading) {
    return (
      <div className={styles.centerState}>
        <Loader2 size={40} className={styles.spinIcon} />
        <p className={styles.loadingText}>Đang tạo mã QR...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.centerState}>
        <XCircle size={56} className={styles.errorIcon} />
        <h2 className={styles.stateTitle}>Có lỗi xảy ra</h2>
        <p className={styles.stateDesc}>{error}</p>
        <Link href="/cart" className={styles.btnBack}>← Quay về giỏ hàng</Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.centerState}>
        <div className={styles.successCircle}>
          <CheckCircle2 size={64} className={styles.successIcon} />
        </div>
        <h2 className={styles.stateTitle}>Thanh toán thành công! 🎉</h2>
        <p className={styles.stateDesc}>
          Đơn hàng #{qrData?.orderId} đã được xác nhận.<br />
          Đang chuyển tới khóa học của bạn...
        </p>
        <div className={styles.redirectNote}>
          <Loader2 size={16} className={styles.spinIcon} /> Đang chuyển hướng...
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className={styles.centerState}>
        <Clock size={56} className={styles.warnIcon} />
        <h2 className={styles.stateTitle}>Mã QR đã hết hạn</h2>
        <p className={styles.stateDesc}>Mã QR có hiệu lực 15 phút. Vui lòng tạo lại.</p>
        <Link href="/cart" className={styles.btnBack}>← Quay về giỏ hàng</Link>
      </div>
    );
  }

  return (
    <div className={styles.paymentLayout}>
      {/* LEFT: QR Code */}
      <div className={styles.qrCard}>
        <div className={styles.qrHeader}>
          <QrCode size={20} />
          <span>Quét mã QR để thanh toán</span>
        </div>

        {qrData && (
          <div className={styles.qrWrapper}>
            <img
              src={qrData.qrUrl}
              alt="VietQR Payment"
              className={styles.qrImage}
              onError={(e) => {
                // Fallback nếu VietQR load lỗi
                (e.target as HTMLImageElement).src =
                  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.transferContent)}`;
              }}
            />
            <div className={styles.qrBranding}>
              <span className={styles.vietqrBadge}>VietQR</span>
              <span className={styles.napasText}>Powered by Napas 247</span>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className={`${styles.timer} ${timeLeft < 60000 ? styles.timerUrgent : ""}`}>
          <Clock size={14} />
          <span>Hết hạn sau: <strong>{formatTime(timeLeft)}</strong></span>
        </div>

        {/* Polling indicator */}
        <div className={styles.pollingRow}>
          <span className={styles.pollingDot} />
          <span className={styles.pollingText}>
            Đang kiểm tra thanh toán... ({pollCount > 0 ? `kiểm tra lần ${pollCount}` : "chờ giao dịch"})
          </span>
        </div>

        <div className={styles.bankApps}>
          <p className={styles.bankAppsLabel}>Hỗ trợ mọi ứng dụng ngân hàng</p>
          <div className={styles.bankAppIcons}>
            {["VCB Digibank", "MB Bank", "Techcombank", "VietinBank", "Momo", "ZaloPay"].map(app => (
              <span key={app} className={styles.bankAppChip}>{app}</span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Bank info + Amount */}
      <div className={styles.infoCard}>
        {/* Amount */}
        <div className={styles.amountBox}>
          <p className={styles.amountLabel}>Số tiền cần chuyển</p>
          <p className={styles.amountVnd}>
            {qrData?.totalVnd.toLocaleString("vi-VN")}₫
          </p>
          <p className={styles.amountUsd}>≈ ${qrData?.totalUsd.toFixed(2)} USD</p>
        </div>

        {/* Bank info rows */}
        <div className={styles.bankInfoSection}>
          <h3 className={styles.bankInfoTitle}>Thông tin chuyển khoản</h3>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>Ngân hàng</span>
            <div className={styles.bankValue}>
              {bankName(qrData?.bankBin ?? "")}
            </div>
          </div>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>Số tài khoản</span>
            <div className={styles.bankValueRow}>
              <span className={styles.bankValue}>{qrData?.accountNumber}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(qrData?.accountNumber ?? "", "account")}
              >
                {copied === "account" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied === "account" ? "Đã copy" : "Copy"}
              </button>
            </div>
          </div>

          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>Tên tài khoản</span>
            <span className={styles.bankValue}>{qrData?.accountName}</span>
          </div>

          <div className={`${styles.bankRow} ${styles.bankRowHighlight}`}>
            <span className={styles.bankLabel}>Nội dung CK</span>
            <div className={styles.bankValueRow}>
              <span className={`${styles.bankValue} ${styles.transferContent}`}>
                {qrData?.transferContent}
              </span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(qrData?.transferContent ?? "", "content")}
              >
                {copied === "content" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied === "content" ? "Đã copy" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className={styles.warningBox}>
          <span>⚠️</span>
          <p>
            <strong>Nhập đúng nội dung chuyển khoản</strong> để hệ thống tự động xác nhận.
            Nếu nhập sai, vui lòng liên hệ hỗ trợ.
          </p>
        </div>

        {/* Security */}
        <div className={styles.secureRow}>
          <ShieldCheck size={14} />
          <span>Giao dịch được bảo mật qua kênh ngân hàng chính thức</span>
        </div>

        <Link href="/cart" className={styles.cancelLink}>
          ← Hủy và quay về giỏ hàng
        </Link>
      </div>
    </div>
  );
}

export default function QrPaymentPage() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.pageTitle}>
          <QrCode size={24} />
          <h1>Thanh toán QR Code</h1>
        </div>
        <Suspense
          fallback={
            <div className={styles.centerState}>
              <Loader2 size={36} className={styles.spinIcon} />
            </div>
          }
        >
          <QrPaymentContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
