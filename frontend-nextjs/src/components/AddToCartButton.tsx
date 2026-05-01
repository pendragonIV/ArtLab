"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ courseId, className, label }: { courseId: number, className?: string, label?: string }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!session) {
      alert("Please sign in to add courses to your cart.");
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const token = session.backendToken;

      const res = await fetch(`http://localhost:5149/api/cart/${courseId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Course added to cart successfully!");
        router.push("/cart");
      } else {
        const errorText = await res.text();
        alert(errorText || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart} 
      className={className}
      disabled={loading}
      style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? "Adding..." : (label ?? "Add to Cart")}
    </button>
  );
}

