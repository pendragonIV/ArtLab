"use client";

import Link from 'next/link';
import { Search, ShoppingCart, Menu, Globe, ChevronDown, BookOpen, Palette, Gamepad2, Code, FileVideo, Music, Star, LogOut, User, Check, Layers, Sword, MonitorPlay, Scissors, Flame, Zap, Users, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES } from '@/lib/translations';

type CourseResult = {
  id: number;
  title: string;
  author: string;
};

// ─── Mega Category Data (Coloso-inspired) ───────────────────────────────────
const CATEGORIES = [
  {
    name: 'Illustration',
    icon: Palette,
    color: '#a78bfa',
    subs: ['Anatomy', 'Characters', 'Concept Art', 'Grisaille', 'Webtoon', 'Realistic', 'Fantasy Art'],
  },
  {
    name: '3D & Animation',
    icon: Layers,
    color: '#60a5fa',
    subs: ['3D Modeling', 'Blender', 'Maya', '2D Animation', 'VFX', 'Motion Graphics'],
  },
  {
    name: 'Game Design',
    icon: Gamepad2,
    color: '#fbbf24',
    subs: ['Game Art', 'Pixel Art', 'Level Design', 'Unity', 'Unreal Engine', 'Indie Dev'],
  },
  {
    name: 'Design',
    icon: BookOpen,
    color: '#34d399',
    subs: ['Graphic Design', 'UI/UX', 'Brand Identity', 'Typography', 'Web Design'],
  },
  {
    name: 'Media',
    icon: FileVideo,
    color: '#f97316',
    subs: ['Video Editing', 'Photography', 'Cinematography', 'Retouching', 'Color Grading'],
  },
  {
    name: 'Development',
    icon: Code,
    color: '#22d3ee',
    subs: ['Web Dev', 'Mobile Apps', 'Machine Learning', 'Python', 'JavaScript'],
  },
  {
    name: 'Music & Audio',
    icon: Music,
    color: '#fb7185',
    subs: ['Music Production', 'Sound Design', 'Mixing & Mastering', 'Film Scoring'],
  },
  {
    name: 'Lifestyle',
    icon: Star,
    color: '#e879f9',
    subs: ['Fashion Design', 'Food Art', 'Calligraphy', 'Knitting', 'Pottery'],
  },
];


const NAV_PROMOS = [
  { labelKey: 'promos30off',  label: '⚡ 30% OFF', href: '/events/30-off', highlight: true, badge: 'HOT' },
  { labelKey: 'series',      label: 'Series',    href: '/series', highlight: false },
  { labelKey: 'promos63off', label: '63% Off',   href: '/events/63-off', highlight: true },
  { labelKey: 'classcut',    label: 'Classcut',  href: '/classcut', highlight: false },
  { labelKey: 'shorts',      label: 'Shorts',    href: '/shorts', highlight: false },
];

const NAV_NORMAL = [
  { labelKey: 'drawing',    label: 'Drawing',    href: '/category/illustration' },
  { labelKey: 'earlyBirds', label: 'EarlyBirds', href: '/events/earlybirds' },
  { labelKey: 'welcome',    label: 'Welcome',    href: '/events/welcome' },
  { labelKey: 'events',     label: 'Events',     href: '/events' },
  { labelKey: 'free',       label: 'Free',       href: '/events/free-learning' },
];

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t, lang, setLang, currentLangMeta } = useLanguage();

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch cart count
  useEffect(() => {
    if (!session) return;
    // @ts-ignore
    const token = session?.backendToken;
    if (!token) return;
    fetch('http://localhost:5149/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setCartCount(Array.isArray(data?.items) ? data.items.length : 0))
      .catch(() => {});
  }, [session]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:5149/api/courses/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const ActiveIcon = CATEGORIES[activeCat]?.icon;

  return (
    <header className={styles.header}>
      {/* ─── MOBILE MENU OVERLAY ────────────────────────────── */}
      {showMobileMenu && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenuHeader}>
            <div className={styles.logoBox} style={{ margin: 0 }}>
              Art<span className={styles.accent}>Lab</span><span className={styles.logoDot}>.</span>
            </div>
            <button className={styles.mobileMenuClose} onClick={() => setShowMobileMenu(false)}>
              <X size={24} />
            </button>
          </div>

          <div className={styles.mobileNavGroup}>
            <div className={styles.mobileNavTitle}>Promos & Special</div>
            {NAV_PROMOS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileNavItem}
                onClick={() => setShowMobileMenu(false)}
                style={item.highlight ? { color: '#facc15' } : {}}
              >
                {item.label}
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            ))}
          </div>

          <div className={styles.mobileNavGroup}>
            <div className={styles.mobileNavTitle}>Explore</div>
            {NAV_NORMAL.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileNavItem}
                onClick={() => setShowMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className={styles.mobileNavGroup}>
            <div className={styles.mobileNavTitle}>Categories</div>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                href={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={styles.mobileNavItem}
                onClick={() => setShowMobileMenu(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── TOP BAR ─────────────────────────────────────────── */}
      <div className={styles.topBar}>
        {/* Hamburger for Mobile */}
        <button className={styles.mobileMenuBtn} onClick={() => setShowMobileMenu(true)}>
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className={styles.logoBox}>
          <Link href="/">
            Art<span className={styles.accent}>Lab</span><span className={styles.logoDot}>.</span>
          </Link>
        </div>

        {/* Search */}
        <div className={styles.searchBox} ref={searchBoxRef}>
          <Search size={14} color="#666" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
            >×</button>
          )}

          {showDropdown && (
            <div className={styles.searchDropdown}>
              {isSearching ? (
                <div className={styles.dropdownMsg}>
                  <div className={styles.searchSpinner} />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className={styles.dropdownSection}>Results</div>
                  {searchResults.slice(0, 6).map(course => (
                    <div
                      key={course.id}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery('');
                        router.push(`/course/${course.id}`);
                      }}
                    >
                      <Search size={12} className={styles.dropdownItemIcon} />
                      <div className={styles.dropdownItemText}>
                        <div className={styles.resultTitle}>{course.title}</div>
                        <div className={styles.resultAuthor}>{course.author}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles.dropdownMsg}>No courses found for &quot;{searchQuery}&quot;</div>
              )}
            </div>
          )}
        </div>

        {/* Right side links */}
        <div className={styles.topLinks}>
          {/* Cart with badge */}
          <Link href="/cart" className={styles.topLinkItem}>
            <div className={styles.cartIconWrap}>
              <ShoppingCart size={17} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </div>
            <span>{t('cart')}</span>
          </Link>

          {status === 'loading' ? (
            <span className={styles.topLinkItem} style={{ opacity: 0.4 }}>•••</span>
          ) : session ? (
            <>
              <Link href="/my-courses" className={styles.topLinkItem}>
                <BookOpen size={15} />
                <span>{t('myCourses')}</span>
              </Link>
              {/* Avatar dropdown */}
              <div className={styles.avatarWrapper}>
                <img
                  src={session.user?.image || ''}
                  alt={session.user?.name || 'User'}
                  className={styles.avatar}
                />
                <div className={styles.avatarDropdown}>
                  <div className={styles.avatarDropdownUser}>
                    <div className={styles.avatarDropdownName}>{session.user?.name}</div>
                    <div className={styles.avatarDropdownEmail}>{session.user?.email}</div>
                  </div>
                  <Link href="/profile" className={styles.avatarDropdownItem}>
                    <User size={13} /> Profile
                  </Link>
                  <Link href="/my-courses" className={styles.avatarDropdownItem}>
                    <BookOpen size={13} /> My Courses
                  </Link>
                  {/* Tutor / Admin links */}
                  {((session as any).role === 'Instructor' || (session as any).role === 'Admin') && (
                    <Link href="/tutor" className={styles.avatarDropdownItem}>
                      <Star size={13} /> Tutor Studio
                    </Link>
                  )}
                  {(session as any).role === 'Admin' && (
                    <Link href="/admin" className={styles.avatarDropdownItem}>
                      <Check size={13} /> Admin Panel
                    </Link>
                  )}
                  <div className={styles.avatarDropdownDivider} />
                  <button
                    className={`${styles.avatarDropdownItem} ${styles.avatarDropdownSignout}`}
                    onClick={() => signOut()}
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn('google')}
              className={`${styles.topLinkItem} ${styles.topLinkPrimary}`}
              style={{ fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {t('signIn')}
            </button>
          )}

          {/* Language Selector - Coloso style */}
          <div className={styles.langWrapper} ref={langMenuRef}>
            <button
              className={styles.langBtn}
              onClick={() => setShowLangMenu(l => !l)}
            >
              <Globe size={14} />
              <span className={styles.langFlag}>{currentLangMeta.flag}</span>
              <span>{lang.toUpperCase()}</span>
              <ChevronDown size={11} className={showLangMenu ? styles.chevronOpen : ''} />
            </button>

            {showLangMenu && (
              <div className={styles.langDropdown}>
                <div className={styles.langDropdownTitle}>{t('selectLanguage')}</div>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`${styles.langOption} ${l.code === lang ? styles.langOptionActive : ''}`}
                    onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                  >
                    <span className={styles.langOptionFlag}>{l.flag}</span>
                    <span className={styles.langOptionLabel}>{l.label}</span>
                    {l.code === lang && <Check size={12} className={styles.langCheck} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM NAV BAR ──────────────────────────────────── */}
      <div className={styles.bottomBar}>
        {/* Category Mega Menu Trigger */}
        <div
          className={styles.categoryWrapper}
          onMouseEnter={() => setShowMegaMenu(true)}
          onMouseLeave={() => setShowMegaMenu(false)}
          ref={megaMenuRef}
        >
          <button className={`${styles.categoryBtn} ${showMegaMenu ? styles.categoryBtnActive : ''}`}>
            <Menu size={16} />
            <span>{t('category')}</span>
            <ChevronDown size={13} className={`${styles.categoryChevron} ${showMegaMenu ? styles.chevronOpen : ''}`} />
          </button>

          {/* ─── MEGA MENU ──────────────────────────────────── */}
          {showMegaMenu && (
            <div className={styles.megaMenu}>
              {/* Left column: category list */}
              <div className={styles.megaLeft}>
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.name}
                      className={`${styles.megaCatItem} ${i === activeCat ? styles.megaCatItemActive : ''}`}
                      onMouseEnter={() => setActiveCat(i)}
                    >
                      <Icon size={15} color={i === activeCat ? cat.color : '#888'} />
                      <span>{cat.name}</span>
                      <span className={styles.megaChevron}>›</span>
                    </button>
                  );
                })}
              </div>

              {/* Right column: subcategories */}
              <div className={styles.megaRight}>
                <div className={styles.megaRightHeader}>
                  {ActiveIcon && <ActiveIcon size={16} color={CATEGORIES[activeCat].color} />}
                  <span style={{ color: CATEGORIES[activeCat].color }}>{CATEGORIES[activeCat].name}</span>
                </div>
                <div className={styles.megaSubGrid}>
                  {CATEGORIES[activeCat].subs.map(sub => (
                    <Link
                      key={sub}
                      href={`/category/${CATEGORIES[activeCat].name.toLowerCase().replace(/\s+/g, '-')}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                      className={styles.megaSubItem}
                      onClick={() => setShowMegaMenu(false)}
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
                {/* CTA at bottom of mega menu */}
                <Link
                  href={`/category/${CATEGORIES[activeCat].name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={styles.megaViewAll}
                  onClick={() => setShowMegaMenu(false)}
                >
                  View all {CATEGORIES[activeCat].name} →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Promo nav links */}
        <nav className={styles.bottomNavLinks}>
          {NAV_PROMOS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${item.highlight ? styles.navItemHighlight : ''}`}
            >
              {item.label}
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </Link>
          ))}

          <span className={styles.navDivider} />

          {NAV_NORMAL.map(item => (
            <Link key={item.href} href={item.href} className={styles.navItemNormal}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
