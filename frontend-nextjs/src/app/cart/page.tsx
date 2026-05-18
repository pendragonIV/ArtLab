"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Trash2, Scissors, ShieldCheck, CreditCard, Landmark, Tag, CheckCircle2, AlertCircle, Loader2, QrCode } from "lucide-react";
import styles from "./page.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5149";

type CartItem = {
  cartItemId: number;
  courseId: number;
  chapterId: number | null;
  isChapterPurchase: boolean;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  courseName: string;
  chapterTitle: string | null;
};

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  return { toasts, success: (m: string) => add("success", m), error: (m: string) => add("error", m), info: (m: string) => add("info", m) };
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const { toasts, success, error, info } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"VNPay" | "BankTransfer" | "QR">("VNPay");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; maxDiscountAmount: number | null } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { setLoading(false); return; }
    if (session) fetchCart();
  }, [session, status]);

  const getToken = () => (session as any)?.backendToken as string | undefined;

  const fetchCart = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/cart`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setItems(await res.json());
    } catch { error("Không thể tải giỏ hàng"); }
    finally { setLoading(false); }
  };

  const handleRemove = async (cartItemId: number) => {
    setRemovingId(cartItemId);
    try {
      const res = await fetch(`${BACKEND}/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
        info("Đã xóa khỏi giỏ hàng");
      } else {
        error("Không thể xóa sản phẩm");
      }
    } catch { error("Có lỗi xảy ra"); }
    finally { setRemovingId(null); }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || checkingOut) return;

    // QR: redirect thẳng sang trang QR
    if (paymentMethod === "QR") {
      const params = new URLSearchParams();
      if (appliedCoupon) params.set("coupon", appliedCoupon.code);
      window.location.href = `/checkout/qr-payment?${params.toString()}`;
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch(`${BACKEND}/api/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, couponCode: appliedCoupon?.code })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          success("Đơn hàng đã được tạo!");
          window.location.href = "/my-courses";
        }
      } else {
        const text = await res.text();
        error(`Thanh toán thất bại: ${text}`);
        setCheckingOut(false);
      }
    } catch {
      error("Có lỗi kết nối. Vui lòng thử lại.");
      setCheckingOut(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || applyingCoupon) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch(`${BACKEND}/api/coupons/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data);
        success(`Áp dụng mã giảm giá -${data.discountPercent}% thành công!`);
      } else {
        setCouponError(data.message || "Mã không hợp lệ");
        setAppliedCoupon(null);
      }
    } catch { setCouponError("Lỗi kết nối"); }
    finally { setApplyingCoupon(false); }
  };

  const originalTotal = items.reduce((s, i) => s + i.originalPrice, 0);
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const savedAmount = originalTotal - subtotal;
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = subtotal * (appliedCoupon.discountPercent / 100);
    if (appliedCoupon.maxDiscountAmount && couponDiscount > appliedCoupon.maxDiscountAmount)
      couponDiscount = appliedCoupon.maxDiscountAmount;
  }
  const totalPrice = Math.max(0, subtotal - couponDiscount);
  const vndTotal = Math.round(totalPrice * 25000);

  return (
    <>
      <Header />

      {/* Toast notifications */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <AlertCircle size={16} />}
            {t.message}
          </div>
        ))}
      </div>

      <main className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>{t("cartTitle")}</h1>
          {items.length > 0 && (
            <span className={styles.itemCount}>{items.length} khóa học</span>
          )}
        </div>

        {status === "loading" || loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={40} className={styles.spinnerIcon} />
            <p>{t("cartLoading")}</p>
          </div>
        ) : status === "unauthenticated" ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={56} className={styles.emptyIcon} />
            <h2>Vui lòng đăng nhập</h2>
            <p>{t("cartSignInRequired")}</p>
            <Link href="/api/auth/signin" className={styles.continueBtn}>Đăng nhập</Link>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyBag}>🛍️</div>
            <h2>Giỏ hàng trống</h2>
            <p>{t("cartEmpty")}</p>
            <Link href="/" className={styles.continueBtn}>{t("cartBrowseCourses")}</Link>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            {/* LEFT: Item list */}
            <div className={styles.itemList}>
              {items.map(item => (
                <div key={item.cartItemId} className={`${styles.cartItem} ${removingId === item.cartItemId ? styles.removing : ""}`}>
                  <div className={styles.itemThumb}>
                    <img src={item.thumbnailUrl} alt={item.title} className={styles.itemImage} />
                  </div>
                  <div className={styles.itemDetails}>
                    {item.isChapterPurchase && (
                      <span className={styles.classcutBadge}>
                        <Scissors size={10} /> CLASSCUT
                      </span>
                    )}
                    <Link href={`/course/${item.courseId}`} className={styles.itemTitle}>{item.title}</Link>
                    <p className={styles.itemAuthor}>{item.author}</p>
                    <div className={styles.itemPriceBox}>
                      <span className={styles.itemPrice}>${item.price.toFixed(2)}</span>
                      {item.originalPrice > item.price && (
                        <span className={styles.itemOriginalPrice}>${item.originalPrice.toFixed(2)}</span>
                      )}
                      {item.originalPrice > item.price && (
                        <span className={styles.saveBadge}>
                          -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.cartItemId)}
                    className={styles.removeBtn}
                    disabled={removingId === item.cartItemId}
                    title="Xóa khỏi giỏ hàng"
                  >
                    {removingId === item.cartItemId
                      ? <Loader2 size={18} className={styles.spinIcon} />
                      : <Trash2 size={18} />
                    }
                  </button>
                </div>
              ))}
            </div>

            {/* RIGHT: Order summary */}
            <div className={styles.checkoutBox}>
              <h2 className={styles.checkoutTitle}>{t("cartOrderSummary")}</h2>

              {/* Price breakdown */}
              <div className={styles.priceSection}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>{t("cartOriginalPrice")}</span>
                  <span>${originalTotal.toFixed(2)}</span>
                </div>
                {savedAmount > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>{t("cartDiscounts")}</span>
                    <span className={styles.discount}>-${savedAmount.toFixed(2)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>{t("cartCouponDiscount")}</span>
                    <span className={styles.discount}>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div className={styles.couponSection}>
                <label className={styles.couponLabel}>
                  <Tag size={14} /> Mã giảm giá
                </label>
                <div className={styles.couponInputGroup}>
                  <input
                    type="text"
                    placeholder="Nhập mã..."
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    className={`${styles.couponInput} ${couponError ? styles.couponInputError : ""}`}
                    onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button className={styles.couponBtnRemove} onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                      Xóa
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className={styles.couponBtn}
                    >
                      {applyingCoupon ? <Loader2 size={14} className={styles.spinIcon} /> : t("cartApply")}
                    </button>
                  )}
                </div>
                {couponError && <p className={styles.couponError}><AlertCircle size={12} /> {couponError}</p>}
                {appliedCoupon && (
                  <p className={styles.couponSuccess}>
                    <CheckCircle2 size={12} /> {t("cartCouponApplied")} (-{appliedCoupon.discountPercent}%)
                  </p>
                )}
              </div>

              {/* Total */}
              <div className={styles.divider} />
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>{t("cartTotal")}</span>
                <div className={styles.totalAmounts}>
                  <span className={styles.totalUSD}>${totalPrice.toFixed(2)}</span>
                  <span className={styles.totalVND}>≈ {vndTotal.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className={styles.paymentMethods}>
                <h3 className={styles.paymentTitle}>{t("cartPaymentMethod")}</h3>

                {/* QR Code - recommended */}
                <div
                  className={`${styles.paymentOption} ${paymentMethod === "QR" ? styles.selected : ""}`}
                  onClick={() => setPaymentMethod("QR")}
                >
                  <div className={styles.radioWrap}>
                    <div className={styles.radioCircle}>
                      {paymentMethod === "QR" && <div className={styles.radioInner} />}
                    </div>
                  </div>
                  <QrCode size={18} className={styles.payIcon} />
                  <div className={styles.payInfo}>
                    <span className={styles.payName}>QR Code / Chuyển khoản</span>
                    <span className={styles.payDesc}>Quét QR bằng app ngân hàng bất kỳ • Tự động xác nhận</span>
                  </div>
                  <span className={styles.payBadge}>Nhanh nhất</span>
                </div>

                <div
                  className={`${styles.paymentOption} ${paymentMethod === "VNPay" ? styles.selected : ""}`}
                  onClick={() => setPaymentMethod("VNPay")}
                >
                  <div className={styles.radioWrap}>
                    <div className={styles.radioCircle}>
                      {paymentMethod === "VNPay" && <div className={styles.radioInner} />}
                    </div>
                  </div>
                  <CreditCard size={18} className={styles.payIcon} />
                  <div className={styles.payInfo}>
                    <span className={styles.payName}>VNPay</span>
                    <span className={styles.payDesc}>Thẻ ATM / Visa / Mastercard / QR Code</span>
                  </div>
                  <span className={styles.payBadge}>Phổ biến</span>
                </div>

                <div
                  className={`${styles.paymentOption} ${paymentMethod === "BankTransfer" ? styles.selected : ""}`}
                  onClick={() => setPaymentMethod("BankTransfer")}
                >
                  <div className={styles.radioWrap}>
                    <div className={styles.radioCircle}>
                      {paymentMethod === "BankTransfer" && <div className={styles.radioInner} />}
                    </div>
                  </div>
                  <Landmark size={18} className={styles.payIcon} />
                  <div className={styles.payInfo}>
                    <span className={styles.payName}>{t("cartBankTransfer")}</span>
                    <span className={styles.payDesc}>Chuyển khoản thủ công • Admin xác nhận trong 1-24h</span>
                  </div>
                </div>
              </div>

              {/* Security note */}
              <div className={styles.secureNote}>
                <ShieldCheck size={14} />
                <span>Thanh toán an toàn, được bảo mật bởi VNPay</span>
              </div>

              {/* Checkout button */}
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={checkingOut || items.length === 0}
              >
                {checkingOut ? (
                  <><Loader2 size={18} className={styles.spinIcon} /> {t("cartProcessing")}</>
                ) : (
                  <>{t("cartCheckout")} — ${totalPrice.toFixed(2)}</>
                )}
              </button>

              <p className={styles.tos}>
                Bằng cách thanh toán, bạn đồng ý với{" "}
                <Link href="/terms" className={styles.tosLink}>điều khoản sử dụng</Link> của ArtLab
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
