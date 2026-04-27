import Link from 'next/link';
import { Search, ShoppingCart, Menu, Globe } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.logoBox}>
          <Link href="/">
            Art<span className={styles.accent}>Lab</span>
          </Link>
        </div>
        
        <div className={styles.searchBox}>
          <Search size={14} color="#898989" />
          <input type="text" placeholder="Search for classes" className={styles.searchInput} />
        </div>

        <div className={styles.topLinks}>
          <Link href="/cart" className={styles.topLinkItem}>
            <ShoppingCart size={16} />
            <span>Cart</span>
          </Link>
          <Link href="/login" className={styles.topLinkItem}>
            <span>Sign In</span>
          </Link>
          <Link href="/lang" className={styles.topLinkItem}>
            <Globe size={16} />
            <span>English</span>
          </Link>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.categoryBtn}>
          <Menu size={18} />
          Category
        </button>

        <nav className={styles.bottomNavLinks}>
          <Link href="#" className={styles.navItem}>🪙30% OFF</Link>
          <Link href="#" className={styles.navItem}>Series</Link>
          <Link href="#" className={styles.navItem}>63% Off</Link>
          <Link href="#" className={styles.navItem}>Classcut</Link>
          <Link href="#" className={styles.navItemNormal}>DRAWING</Link>
          <Link href="#" className={styles.navItemNormal}>THAI</Link>
          <Link href="#" className={styles.navItemNormal}>EarlyBirds</Link>
          <Link href="#" className={styles.navItemNormal}>Welcome</Link>
          <Link href="#" className={styles.navItemNormal}>Event</Link>
        </nav>
      </div>
    </header>
  );
}
