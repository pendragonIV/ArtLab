import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import StickyCountdown from "./StickyCountdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type SeriesCourse = {
  id: number;
  title: string;
  author: string;
  thumbnailUrl: string;
  price: number;
  originalPrice: number;
  category: string;
  chapterCount: number;
  orderIndex: number;
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

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/series/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return notFound();

  const series: Series = await res.json();
  const savings = (series.originalPrice - series.price).toFixed(2);
  const discountPct = Math.round(
    (1 - series.price / series.originalPrice) * 100
  );

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <img
            src={series.thumbnailUrl}
            alt={series.title}
            className={styles.heroBg}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <Link href="/series" className={styles.backLink}>
              ← All Series
            </Link>
            <span className={styles.bundleTag}>
              {series.courseCount} COURSES BUNDLE
            </span>
            <h1 className={styles.heroTitle}>{series.title}</h1>
            <p className={styles.heroDesc}>{series.description}</p>
          </div>
        </section>

        <div className={styles.bodyGrid}>
          {/* LEFT: Course list */}
          <section className={styles.courseList}>
            <h2 className={styles.sectionTitle}>
              What's included
              <span className={styles.count}>({series.courseCount} courses)</span>
            </h2>

            {series.courses.map((course, idx) => (
              <div key={course.id} className={styles.courseRow}>
                <div className={styles.stepNum}>{idx + 1}</div>
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className={styles.courseThumb}
                />
                <div className={styles.courseInfo}>
                  <span className={styles.courseCat}>{course.category}</span>
                  <h3 className={styles.courseTitle}>
                    <Link href={`/course/${course.id}`}>{course.title}</Link>
                  </h3>
                  <p className={styles.courseAuthor}>
                    by{" "}
                    <Link href={`/instructor/${encodeURIComponent(course.author)}`}>
                      {course.author}
                    </Link>
                  </p>
                  <span className={styles.chapterCount}>
                    {course.chapterCount} chapters
                  </span>
                </div>
                <div className={styles.coursePrice}>
                  ${course.price.toFixed(2)}
                </div>
              </div>
            ))}
          </section>

          {/* RIGHT: Sticky purchase box */}
          <aside className={styles.purchaseBox}>
            <img
              src={series.thumbnailUrl}
              alt={series.title}
              className={styles.purchaseThumb}
            />
            <div className={styles.purchaseBody}>
              <div className={styles.purchasePriceRow}>
                <span className={styles.purchasePrice}>
                  ${series.price.toFixed(2)}
                </span>
                <span className={styles.purchaseOriginal}>
                  ${series.originalPrice.toFixed(2)}
                </span>
                <span className={styles.discountBadge}>-{discountPct}%</span>
              </div>
              <p className={styles.savingsText}>
                🎉 You save <strong>${savings}</strong> vs buying separately
              </p>

              <AddToCartButton
                courseId={series.courses[0]?.id ?? 0}
                className={styles.addToCartBtn}
              />

              <div className={styles.includedList}>
                <p className={styles.includedTitle}>This bundle includes:</p>
                {series.courses.map((c) => (
                  <div key={c.id} className={styles.includedItem}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <StickyCountdown />
      <Footer />
    </>
  );
}
