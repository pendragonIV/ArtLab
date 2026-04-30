import Link from 'next/link';
import styles from './CourseCard.module.css';

type CourseCardProps = {
  id: number;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isNew?: boolean;
  isTrending?: boolean;
};

export default function CourseCard({
  id, title, author, price, originalPrice, thumbnailUrl, isNew
}: CourseCardProps) {
  return (
    <Link href={`/course/${id}`} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        {isNew && <span className={styles.badge}>NEW</span>}
        <img src={thumbnailUrl} alt={title} className={styles.thumbnail} />
      </div>
      <h3 className={styles.courseTitle}>{title}</h3>
      <p className={styles.author}>{author}</p>
      <div className={styles.priceBox}>
        <span className={styles.price}>${price.toFixed(2)}</span>
        <span className={styles.originalPrice}>${originalPrice.toFixed(2)}</span>
        <span className={styles.couponTag}>[Coupon]</span>
      </div>
    </Link>
  );
}
