"use client";

import { useEffect, useState } from "react";
import styles from "./StickyCountdown.module.css";
import { Clock } from "lucide-react";

export default function StickyCountdown() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    // Hardcoded end date for demo purposes
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.stickyBar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Clock className={styles.icon} />
          <div className={styles.textGroup}>
            <span className={styles.label}>Time is running out!</span>
            <span className={styles.date}>April 30th 23:59 PM (PDT)</span>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.untilText}>
            Until the event<br />ends
          </div>
          <div className={styles.timerBlocks}>
            <div className={styles.block}>
              <span className={styles.num}>{timeLeft.d}</span>
              <span className={styles.unit}>d</span>
            </div>
            <div className={styles.block}>
              <span className={styles.num}>{timeLeft.h}</span>
              <span className={styles.unit}>h</span>
            </div>
            <div className={styles.block}>
              <span className={styles.num}>{timeLeft.m}</span>
              <span className={styles.unit}>m</span>
            </div>
            <div className={styles.block}>
              <span className={styles.num}>{timeLeft.s}</span>
              <span className={styles.unit}>s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
