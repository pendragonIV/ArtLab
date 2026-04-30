"use client";

import Link from 'next/link';
import { Search, ShoppingCart, Menu, Globe } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

type CourseResult = {
  id: number;
  title: string;
  author: string;
};

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.logoBox}>
          <Link href="/">
            Art<span className={styles.accent}>Lab</span>
          </Link>
        </div>
        
        <div className={styles.searchBox} ref={searchBoxRef}>
          <Search size={14} color="#898989" />
          <input 
            type="text" 
            placeholder="Search for classes" 
            className={styles.searchInput} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />
          
          {showDropdown && (
            <div className={styles.searchDropdown}>
              {isSearching ? (
                <div className={styles.dropdownItem} style={{ color: '#888' }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(course => (
                  <div 
                    key={course.id} 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                      router.push(`/course/${course.id}`);
                    }}
                  >
                    <Search size={12} color="#898989" style={{ marginRight: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div className={styles.resultTitle}>{course.title}</div>
                      <div className={styles.resultAuthor}>{course.author}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.dropdownItem} style={{ color: '#888' }}>No courses found.</div>
              )}
            </div>
          )}
        </div>

        <div className={styles.topLinks}>
          <Link href="/cart" className={styles.topLinkItem}>
            <ShoppingCart size={16} />
            <span>Cart</span>
          </Link>
          {status === 'loading' ? (
             <span className={styles.topLinkItem}>...</span>
          ) : session ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link href="/my-courses" className={styles.topLinkItem} style={{ fontWeight: 600 }}>
                  My Courses
                </Link>
                <Link href="/profile" className={styles.topLinkItem} style={{ fontWeight: 600 }}>
                  Profile
                </Link>
                <div className={styles.topLinkItem} style={{ gap: '8px', cursor: 'pointer' }} onClick={() => signOut()}>
                  <img src={session.user?.image || ''} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  <span>{session.user?.name}</span>
                </div>
             </div>
          ) : (
            <button onClick={() => signIn('google')} className={styles.topLinkItem} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>
              <span>Sign In</span>
            </button>
          )}
          <Link href="/lang" className={styles.topLinkItem}>
            <Globe size={16} />
            <span>English</span>
          </Link>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.categoryWrapper}>
          <button className={styles.categoryBtn}>
            <Menu size={18} />
            Category
          </button>
          
          <div className={styles.categoryDropdown}>
            <Link href="/category/illustration" className={styles.categoryDropdownItem}>Illustration</Link>
            <Link href="/category/3d-art" className={styles.categoryDropdownItem}>3D Art</Link>
            <Link href="/category/concept-art" className={styles.categoryDropdownItem}>Concept Art</Link>
            <Link href="/category/animation" className={styles.categoryDropdownItem}>Animation</Link>
            <Link href="/category/graphic-design" className={styles.categoryDropdownItem}>Graphic Design</Link>
          </div>
        </div>

        <nav className={styles.bottomNavLinks}>
          <Link href="/events/30-off" className={styles.navItem}>🪙30% OFF</Link>
          <Link href="/series" className={styles.navItem}>Series</Link>
          <Link href="/events/63-off" className={styles.navItem}>63% Off</Link>
          <Link href="/classcut" className={styles.navItem}>Classcut</Link>
          <Link href="/shorts" className={styles.navItem}>Shorts</Link>
          <Link href="/category/illustration" className={styles.navItemNormal}>DRAWING</Link>
          <Link href="/category/thai" className={styles.navItemNormal}>THAI</Link>
          <Link href="/events/earlybirds" className={styles.navItemNormal}>EarlyBirds</Link>
          <Link href="/events/welcome" className={styles.navItemNormal}>Welcome</Link>
          <Link href="/events/event" className={styles.navItemNormal}>Event</Link>
        </nav>
      </div>
    </header>
  );
}
