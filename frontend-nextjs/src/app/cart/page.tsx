"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Trash2, Scissors } from "lucide-react";
import styles from "./page.module.css";

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

export default function CartPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    if (session) {
      fetchCart();
    }
  }, [session, status]);

  const fetchCart = async () => {
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch("http://localhost:5149/api/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`http://localhost:5149/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setItems(items.filter(item => item.cartItemId !== cartItemId));
      } else {
        alert("Failed to remove item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch("http://localhost:5149/api/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Payment Successful! Order ID: ${data.orderId}. Enjoy your classes!`);
        setItems([]);
        // Ideally redirect to /my-courses here
        window.location.href = "/my-courses";
      } else {
        const errorText = await res.text();
        alert(`Checkout failed: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <Header />
      <main className={styles.container}>
        <h1 className={styles.title}>Shopping Cart</h1>

        {status === "loading" || loading ? (
          <div className={styles.message}>Loading your cart...</div>
        ) : status === "unauthenticated" ? (
          <div className={styles.message}>
            <p>Please sign in to view your cart.</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.message}>
            <p>Your cart is empty.</p>
            <Link href="/" className={styles.continueBtn}>Browse Courses</Link>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            <div className={styles.itemList}>
              {items.map(item => (
                <div key={item.cartItemId} className={styles.cartItem}>
                  <img src={item.thumbnailUrl} alt={item.title} className={styles.itemImage} />
                  <div className={styles.itemDetails}>
                    {item.isChapterPurchase && (
                      <span className={styles.classcutBadge}>
                        <Scissors size={10} /> CLASSCUT
                      </span>
                    )}
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                    <p className={styles.itemAuthor}>By {item.author}</p>
                    <div className={styles.itemPriceBox}>
                      <span className={styles.itemPrice}>${item.price.toFixed(2)}</span>
                      {!item.isChapterPurchase && (
                        <span className={styles.itemOriginalPrice}>${item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item.cartItemId)} className={styles.removeBtn}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.checkoutBox}>
              <h2 className={styles.checkoutTitle}>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Original Price:</span>
                <span>${items.reduce((s, i) => s + i.originalPrice, 0).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Discounts:</span>
                <span className={styles.discount}>
                  -${(items.reduce((s, i) => s + i.originalPrice, 0) - totalPrice).toFixed(2)}
                </span>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.totalRow}>
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button 
                className={styles.checkoutBtn} 
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                style={{ opacity: (loading || items.length === 0) ? 0.7 : 1 }}
              >
                {loading ? "Processing..." : "Checkout"}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
