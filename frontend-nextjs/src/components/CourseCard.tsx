"use client";
import Link from 'next/link';
import styles from './CourseCard.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

type CourseCardProps = {
  id: number;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isNew?: boolean;
  isTrending?: boolean;
  category?: string;
};

function getDiscountPercent(price: number, original: number) {
  if (!original || original <= price) return null;
  return Math.round((1 - price / original) * 100);
}

export default function CourseCard({
  id, title, author, price, originalPrice, thumbnailUrl, isNew, isTrending, category
}: CourseCardProps) {
  const { t } = useLanguage();
  const discount = getDiscountPercent(price, originalPrice);

  // Derive 1–2 tags from category
  const tags = category ? [category] : [];

  return (
    <Link href={`/course/${id}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        <img src={thumbnailUrl} alt={title} className={styles.thumbnail} />

        {/* Play overlay */}
        <div className={styles.playOverlay}>
          <div className={styles.playIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* Badges */}
        {(isNew || isTrending) && (
          <div className={styles.badgesRow}>
            {isTrending && <span className={styles.badgeTrending}>{t('badgeHot')}</span>}
            {isNew && <span className={styles.badgeNew}>{t('badgeNew')}</span>}
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.tagRow}>
            {tags.map((t, i) => <span key={i} className={styles.tag}>{t}</span>)}
          </div>
        )}

        <h3 className={styles.courseTitle}>{title}</h3>
        <p className={styles.author}>{author}</p>

        <div className={styles.priceBox}>
          <span className={styles.price}>${price.toFixed(2)}</span>
          {originalPrice > price && (
            <span className={styles.originalPrice}>${originalPrice.toFixed(2)}</span>
          )}
          {discount && (
            <span className={styles.discountBadge}>-{discount}%</span>
          )}
        </div>
      </div>
    </Link>
  );
}
