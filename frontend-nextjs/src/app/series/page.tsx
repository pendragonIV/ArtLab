"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import styles from "./page.module.css";

type SeriesCourse = {
  id: number;
  title: string;
  author: string;
  thumbnailUrl: string;
  price: number;
  category: string;
};

type Series = {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  originalPrice: number;
  courseCount: number;
  courses: SeriesCourse[];
};

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5149/api/series")
      .then((r) => r.json())
      .then((data) => { setSeriesList(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const discount = (s: Series) =>
    Math.round((1 - s.price / s.originalPrice) * 100);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.heroPill}>🎓 Bundle &amp; Save</span>
            <h1 className={styles.heroTitle}>ArtLab Series</h1>
            <p className={styles.heroSub}>
              Master a complete pipeline. Bundled courses designed to take you
              from beginner to professional — at a fraction of the price.
            </p>
          </div>
        </div>

        {/* SERIES LIST */}
        <div className={styles.listWrapper}>
          {seriesList.length === 0 ? (
            <div className={styles.empty}>No series available yet.</div>
          ) : (
            seriesList.map((s) => (
              <div key={s.id} className={styles.seriesCard}>
                {/* Left: image */}
                <div className={styles.cardImg}>
                  <img src={s.thumbnailUrl} alt={s.title} />
                  <div className={styles.discountBadge}>-{discount(s)}%</div>
                </div>

                {/* Right: info */}
                <div className={styles.cardBody}>
                  <span className={styles.bundleTag}>
                    {s.courseCount} COURSES BUNDLE
                  </span>
                  <h2 className={styles.cardTitle}>{s.title}</h2>
                  <p className={styles.cardDesc}>{s.description}</p>

                  {/* Inline course previews */}
                  <div className={styles.coursePreviews}>
                    {s.courses.slice(0, 3).map((c) => (
                      <div key={c.id} className={styles.courseChip}>
                        <img src={c.thumbnailUrl} alt={c.title} className={styles.chipThumb} />
                        <span className={styles.chipTitle}>{c.title}</span>
                      </div>
                    ))}
                    {s.courseCount > 3 && (
                      <div className={styles.moreChip}>+{s.courseCount - 3} more</div>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className={styles.cardFooter}>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>${s.price.toFixed(2)}</span>
                      <span className={styles.originalPrice}>
                        ${s.originalPrice.toFixed(2)}
                      </span>
                    </div>
                    <Link href={`/series/${s.id}`} className={styles.viewBtn}>
                      View Series →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
