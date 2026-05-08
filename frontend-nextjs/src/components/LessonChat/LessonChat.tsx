"use client";

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Send, MessageSquare, Clock, ChevronDown } from "lucide-react";
import styles from "./LessonChat.module.css";

/* ---------- Types ---------- */
interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  videoTimestamp: number; // seconds
  content: string;
  createdAt: string;
}

interface LessonChatProps {
  lessonId: number;
  currentVideoTime: number; // seconds
  seekTo: (seconds: number) => void;
}

/* ---------- Helpers ---------- */
function fmtTimestamp(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ---------- Avatar ---------- */
function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={styles.avatar}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className={styles.avatarFallback}
      style={{ width: size, height: size, background: color, borderRadius: "50%", flexShrink: 0, fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, letterSpacing: "-0.5px" }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function LessonChat({ lessonId, currentVideoTime, seekTo }: LessonChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevVisibleCount = useRef(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // @ts-ignore
  const token = session?.backendToken as string | undefined;

  /* ── Fetch ── */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`}/api/chat/lesson/${lessonId}`
      );
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  /* ── Visible messages (filter by currentVideoTime) ── */
  const visibleMessages = showAll
    ? messages
    : messages.filter((m) => m.videoTimestamp <= Math.floor(currentVideoTime));

  /* ── Auto-scroll & new message animation ── */
  useEffect(() => {
    const curr = visibleMessages.length;
    if (curr > prevVisibleCount.current) {
      // Find the newly appeared messages
      const appeared = visibleMessages.slice(prevVisibleCount.current);
      if (appeared.length > 0) {
        setNewIds((prev) => {
          const next = new Set(prev);
          appeared.forEach((m) => next.add(m.id));
          return next;
        });
        // Remove animation class after transition
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            appeared.forEach((m) => next.delete(m.id));
            return next;
          });
        }, 600);
        // Scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 50);
      }
    }
    prevVisibleCount.current = curr;
  }, [visibleMessages.length]); // eslint-disable-line

  /* ── Send ── */
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || sending) return;

    setSending(true);
    const ts = Math.floor(currentVideoTime);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`}/api/chat/lesson/${lessonId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ videoTimestamp: ts, content: input.trim() }),
        }
      );
      if (res.ok) {
        const newMsg: ChatMessage = await res.json();
        setMessages((prev) => [...prev, newMsg].sort((a, b) => a.videoTimestamp - b.videoTimestamp));
        setInput("");
        // Show all so user sees their own message immediately
        if (!showAll && newMsg.videoTimestamp > Math.floor(currentVideoTime)) {
          setShowAll(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const hiddenCount = messages.length - visibleMessages.length;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <MessageSquare size={15} className={styles.headerIcon} />
        <span className={styles.headerTitle}>Chat bài học</span>
        <span className={styles.headerCount}>{messages.length}</span>
      </div>

      {/* Toggle show all */}
      {hiddenCount > 0 && !showAll && (
        <button className={styles.showAllBtn} onClick={() => setShowAll(true)}>
          <ChevronDown size={13} />
          {hiddenCount} chat chưa đến (click để xem trước)
        </button>
      )}
      {showAll && messages.length > 0 && (
        <button className={styles.showAllBtn} onClick={() => setShowAll(false)}>
          Ẩn chat chưa đến
        </button>
      )}

      {/* Messages */}
      <div className={styles.messageList} ref={scrollRef}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={32} className={styles.emptyIcon} />
            <p>Chưa có chat nào</p>
            <span>Hãy là người đầu tiên!</span>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isPending = !showAll && msg.videoTimestamp > Math.floor(currentVideoTime);
            const isNew = newIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`${styles.message} ${isPending ? styles.messagePending : ""} ${isNew ? styles.messageNew : ""}`}
              >
                <Link href={`/profile/${msg.userId}`} className={styles.avatarLink}>
                  <Avatar url={msg.avatarUrl} name={msg.username} size={28} />
                </Link>
                <div className={styles.messageBody}>
                  <div className={styles.messageMeta}>
                    <Link href={`/profile/${msg.userId}`} className={styles.username}>
                      {msg.username}
                    </Link>
                    <button
                      className={styles.timestampBadge}
                      onClick={() => seekTo(msg.videoTimestamp)}
                      title={`Nhảy đến ${fmtTimestamp(msg.videoTimestamp)}`}
                    >
                      <Clock size={10} />
                      {fmtTimestamp(msg.videoTimestamp)}
                    </button>
                  </div>
                  <p className={styles.messageContent}>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSend}>
        {session ? (
          <>
            <div className={styles.inputWrapper}>
              {/* @ts-ignore */}
              <Avatar url={session.user?.image ?? null} name={session.user?.name ?? "U"} size={26} />
              <input
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Chat tại ${fmtTimestamp(Math.floor(currentVideoTime))}...`}
                maxLength={300}
                disabled={sending}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!input.trim() || sending}
                aria-label="Gửi chat"
              >
                <Send size={15} />
              </button>
            </div>
            <div className={styles.charCount}>{input.length}/300</div>
          </>
        ) : (
          <div className={styles.loginPrompt}>
            <Link href="/api/auth/signin" className={styles.loginLink}>
              Đăng nhập để chat
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
