"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Lock, Play, CheckCircle2, Volume2, VolumeX,
  Maximize, Pause, RotateCcw, MessageSquare, BookOpen,
} from "lucide-react";
import styles from "./page.module.css";
import LessonChat from "@/components/LessonChat/LessonChat";

/* ---------- Types ---------- */
type LessonItem = {
  id: number;
  title: string;
  durationSeconds: number;
  isFreePreview: boolean;
  orderIndex: number;
  isLocked: boolean;
};

type ChapterItem = {
  id: number;
  title: string;
  orderIndex: number;
  lessons: LessonItem[];
};

type LessonDetail = {
  id: number;
  title: string;
  durationSeconds: number;
  isFreePreview: boolean;
  orderIndex: number;
  chapterId: number;
  courseId: number;
  courseTitle: string;
  chapterTitle: string;
  videoUrl: string | null;
  vdoCipherVideoId: string | null;
  vdoCipherOtp: string | null;
  vdoCipherPlaybackInfo: string | null;
  isLocked: boolean;
};

/* ---------- Multi-Watermark component ----------
   Hiển thị 5 watermark cùng lúc ở vị trí cố định + random offset,
   chứa email + userId + timestamp — không thể crop hết khi edit video
*/
function MultiWatermark({ label }: { label: string }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>([]);

  // Fixed zones: top-left, top-right, center, bottom-left, bottom-right
  const zones = [
    { baseX: 3,  baseY: 6  },
    { baseX: 55, baseY: 8  },
    { baseX: 25, baseY: 42 },
    { baseX: 4,  baseY: 78 },
    { baseX: 58, baseY: 80 },
  ];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Update timestamp every second so watermark content changes
    const tick = () => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Slightly shift watermark positions every 8s to avoid easy masking
    const shift = () => {
      setOffsets(zones.map(() => ({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 4,
      })));
    };
    shift();
    const t = setInterval(shift, 8000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {zones.map((z, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${z.baseX + (offsets[i]?.x ?? 0)}%`,
            top:  `${z.baseY + (offsets[i]?.y ?? 0)}%`,
            pointerEvents: 'none',
            userSelect: 'none',
            color: 'rgba(255,255,255,0.15)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            zIndex: 20,
            transition: 'left 2s ease, top 2s ease',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            letterSpacing: '0.4px',
            transform: i % 2 === 1 ? 'rotate(-8deg)' : 'rotate(-5deg)',
          }}
        >
          {label} · {time}
        </div>
      ))}
    </>
  );
}

/* ---------- Sidebar Tab ---------- */
type SidebarTab = "curriculum" | "chat";

/* ---------- Main Component ---------- */
export default function LearnPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const courseId = Number(params.courseId);
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [curriculum, setCurriculum] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [collapsedChapters, setCollapsedChapters] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>("curriculum");
  const [isFocused, setIsFocused] = useState(true);

  // HTML5 video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // VdoCipher & Progress Tracking
  const [initialProgress, setInitialProgress] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false); // true sau khi fetch progress xong
  const lastSavedTimeRef = useRef(0);
  const progressRef = useRef(0);       // luôn giữ giá trị mới nhất để dùng trong cleanup
  const vdoPlayerRef = useRef<any>(null);

  // User display name for watermark
  // @ts-ignore
  const userEmail = session?.user?.email ?? session?.user?.name ?? "ArtLab User";

  const authHeaders = useCallback((): HeadersInit => {
    // @ts-ignore
    const token = session?.backendToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [session]);

  /* Fetch curriculum */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`}/api/lessons/course/${courseId}`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setCurriculum(data.chapters || []))
      .catch(console.error);
  }, [courseId, authHeaders]);

  /* Fetch current lesson & progress */
  useEffect(() => {
    setLoading(true);
    setPlaying(false);
    setProgress(0);
    setInitialProgress(0);
    setProgressLoaded(false); // ẩn player cho đến khi progress được xác nhận
    lastSavedTimeRef.current = 0;
    progressRef.current = 0;

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`;
    const lsKey = `artlab_progress_${lessonId}`;

    Promise.all([
      fetch(`${base}/api/lessons/${lessonId}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${base}/api/progress/${lessonId}`, { headers: authHeaders() })
        .then(r => {
          if (r.ok) return r.json();
          // Fallback localStorage khi chưa login (401) hoặc lỗi mạng
          const ls = localStorage.getItem(lsKey);
          return ls ? { watchedSeconds: parseInt(ls, 10) } : { watchedSeconds: 0 };
        })
        .catch(() => {
          const ls = localStorage.getItem(lsKey);
          return ls ? { watchedSeconds: parseInt(ls, 10) } : { watchedSeconds: 0 };
        })
    ])
    .then(([lessonData, progressData]) => {
      const saved = progressData?.watchedSeconds ?? 0;
      // Set tất cả cùng 1 lút trước khi đánh dấu progressLoaded
      // → đảm bảo player render lần đầu đã có đú initialProgress
      if (saved > 0) {
        setInitialProgress(saved);
        setProgress(saved);
        progressRef.current = saved;
      }
      setLesson(lessonData);
      setProgressLoaded(true); // trigger render player sau khi có progress
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [lessonId, authHeaders]);

  /* Save progress – server + localStorage fallback */
  const saveProgress = useCallback((currentTime: number, isCompleted: boolean) => {
    const t = Math.floor(currentTime);
    if (t <= 0) return;
    // Luôn lưu localStorage (hoạt động cả khi offline/chưa login)
    const lsKey = `artlab_progress_${lessonId}`;
    localStorage.setItem(lsKey, String(t));
    // Gửi lên server (sẽ fail silently nếu chưa login)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`}/api/progress/update`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, watchedSeconds: t, isCompleted })
    }).catch(() => {}); // Silent - đã có localStorage backup
  }, [lessonId, authHeaders]);

  /* saveProgressRef – dùng được trong event listener mà không cần deps */
  const saveProgressRef = useRef(saveProgress);
  useEffect(() => { saveProgressRef.current = saveProgress; }, [saveProgress]);

  const handleComplete = useCallback((id: number) => {
    setCompletedLessons((prev) => {
      if (prev.has(id)) return prev;
      const s = new Set(prev); s.add(id); return s;
    });
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}`}/api/lessons/${id}/complete`, {
      method: "POST", headers: authHeaders(),
    }).catch(console.error);
  }, [authHeaders]);

  /* seekTo – unified for both players */
  const seekTo = useCallback((seconds: number) => {
    if (vdoPlayerRef.current?.video) {
      vdoPlayerRef.current.video.currentTime = seconds;
    } else if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  }, []);

  /* Initialize VdoPlayer */
  const initVdoPlayer = useCallback(() => {
    // @ts-ignore
    if (!window.VdoPlayer || !lesson?.vdoCipherOtp) return;
    
    const iframe = document.getElementById("vdo-player-iframe") as HTMLIFrameElement;
    if (!iframe) return;

    try {
      // @ts-ignore
      const player = window.VdoPlayer.getInstance(iframe);
      vdoPlayerRef.current = player;

      // ── Bắt buộc seek qua SDK thay vì chỉ phụ thuộc URL tham số ──
      const applyResume = () => {
        if (initialProgress > 0 && player.video.currentTime < initialProgress - 1) {
          player.video.currentTime = initialProgress;
        }
      };

      player.video.addEventListener("loadedmetadata", applyResume);
      player.video.addEventListener("play", () => {
        // Fallback: nếu video bắt đầu phát mà vẫn chưa seek
        // @ts-ignore
        if (!player.video.__hasResumed && initialProgress > 0) {
          applyResume();
          // @ts-ignore
          player.video.__hasResumed = true;
        }
      });

      player.video.addEventListener("timeupdate", () => {
        const time = player.video.currentTime;
        const dur = player.video.duration;
        setProgress(time);
        progressRef.current = time; // cập nhật ref để save-on-exit đọc được

        // Auto-save every 10 seconds
        if (Math.abs(time - lastSavedTimeRef.current) >= 10) {
          lastSavedTimeRef.current = time;
          saveProgress(time, false);
        }

        if (dur && time / dur > 0.9) {
          handleComplete(lessonId);
          saveProgress(time, true);
        }
      });
    } catch (e) {
      console.error("VdoPlayer init error:", e);
    }
  }, [lesson, initialProgress, saveProgress, handleComplete, lessonId]);

  useEffect(() => {
    if (lesson?.vdoCipherOtp) {
      // Small delay to ensure iframe is mounted
      const t = setTimeout(() => {
        initVdoPlayer();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [lesson, initVdoPlayer]);

  /* ── SAVE ON EXIT ──────────────────────────────────────────────────────
     Lưu tiến trình khi:
     1. Component unmount (navigate sang bài khác / thoát trang trong app)
     2. Tab bị ẩn (Alt+Tab, chuyển tab, tắt màn hình)
     3. beforeunload (đóng trình duyệt, reload, navigate ra ngoài)
     Dùng saveProgressRef để không cần khai báo trong deps array.
  ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const getCurrentTime = (): number => {
      if (vdoPlayerRef.current?.video?.currentTime > 0) {
        return vdoPlayerRef.current.video.currentTime;
      }
      return progressRef.current;
    };

    // 2. Visibility change: user chuyển tab hoặc tắt màn hình
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const t = getCurrentTime();
        if (t > 0) saveProgressRef.current(t, false);
      }
    };

    // 3. beforeunload: đóng trình duyệt / reload
    const onBeforeUnload = () => {
      const t = getCurrentTime();
      if (t > 0) saveProgressRef.current(t, false);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    // 1. Unmount cleanup: navigate trong app (Next.js SPA navigation)
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      const t = getCurrentTime();
      if (t > 0) saveProgressRef.current(t, false);
    };
  }, []); // intentionally empty — refs always have latest values

  /* ── FOCUS TRACKING (Anti Screen Record) ── */
  useEffect(() => {
    const focusCheck = setInterval(() => {
      const hasFocus = document.hasFocus();
      if (!hasFocus && isFocused) {
        setIsFocused(false);
        // Tạm dừng cả 2 loại video
        try { vdoPlayerRef.current?.video?.pause(); } catch (e) {}
        try { videoRef.current?.pause(); } catch (e) {}
      } else if (hasFocus && !isFocused) {
        setIsFocused(true);
      }
    }, 300);

    return () => clearInterval(focusCheck);
  }, [isFocused]);

  /* HTML5 video listeners + RESUME */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Helper: apply resume seek
    const applyResume = () => {
      if (initialProgress > 0 && v.currentTime < initialProgress) {
        v.currentTime = initialProgress;
      }
      if (v.duration) setDuration(v.duration);
    };

    const onPlay = () => setPlaying(true);

    const onPause = () => {
      setPlaying(false);
      if (v.currentTime > 0) saveProgress(v.currentTime, false);
    };

    const onTimeUpdate = () => {
      setProgress(v.currentTime);
      progressRef.current = v.currentTime;
      if (Math.abs(v.currentTime - lastSavedTimeRef.current) >= 10) {
        lastSavedTimeRef.current = v.currentTime;
        saveProgress(v.currentTime, false);
      }
      if (v.duration && v.currentTime / v.duration > 0.9) handleComplete(lessonId);
    };

    const onMeta = () => applyResume();

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onMeta);

    // ── FIX RACE CONDITION ──────────────────────────────────────────────
    // loadedmetadata có thể đã fire trước khi effect này chạy
    // (ví dụ: video được cache, hoặc browser load rất nhanh)
    // readyState >= 1 (HAVE_METADATA) → seek ngay lập tức
    if (v.readyState >= 1) {
      applyResume();
    }

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [lesson?.videoUrl, handleComplete, lessonId, initialProgress, saveProgress]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!playing) {
      // Belt-and-suspenders: nếu video chưa được seek đến đúng vị trí, seek trước rồi mới play
      if (initialProgress > 1 && v.currentTime < initialProgress - 0.5) {
        v.currentTime = initialProgress;
      }
      v.play();
    } else {
      v.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setProgress(Number(e.target.value));
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const allLessons = curriculum.flatMap((ch) => ch.lessons);
  const curIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = curIdx > 0 ? allLessons[curIdx - 1] : null;
  const nextLesson = curIdx < allLessons.length - 1 ? allLessons[curIdx + 1] : null;
  const goToLesson = (id: number) => router.push(`/learn/${courseId}/${id}`);
  const toggleChapter = (id: number) =>
    setCollapsedChapters((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Determine player mode
  const useVdoCipher = !!(lesson?.vdoCipherOtp && lesson?.vdoCipherPlaybackInfo);

  if (loading && !lesson) {
    return <div className={styles.loadingScreen}><div className={styles.spinner} /></div>;
  }

  return (
    <div className={styles.root}>
      {/* TOP NAV */}
      <nav className={styles.topNav}>
        <Link href={`/course/${courseId}`} className={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>{lesson?.courseTitle ?? "Course"}</span>
        </Link>
        <div className={styles.navCenter}>
          <span className={styles.navTitle}>{lesson?.title}</span>
        </div>
        <div className={styles.navRight}>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.progressLabel}>{progressPct}% complete</span>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className={styles.body}>
        <div className={styles.videoArea} style={{ position: 'relative' }}>
          
          {/* Blur Overlay */}
          {!isFocused && !lesson?.isLocked && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: '#000', zIndex: 50, display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', color: '#fff',
              textAlign: 'center', padding: '20px'
            }}>
              <VolumeX size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Playback Paused</h2>
              <p style={{ color: '#a1a1aa' }}>Video is paused because the window lost focus.<br/>Click here to resume learning.</p>
            </div>
          )}

          {lesson?.isLocked ? (
            /* Locked */
            <div className={styles.lockedScreen}>
              <Lock size={56} className={styles.lockIcon} />
              <h2>This lesson is locked</h2>
              <p>Purchase this course to unlock all content.</p>
              <Link href={`/course/${courseId}`} className={styles.buyBtn}>View Course →</Link>
            </div>
          ) : useVdoCipher ? (
            /* ──── VDOCIPHER IFRAME PLAYER (Enterprise DRM) ──── */
            /* Chỉ render sau khi progressLoaded = true → iframe luôn có &time=X đúng */
            progressLoaded ? (
              <div className={styles.vdoWrapper}>
                <Script src="https://player.vdocipher.com/v2/api.js" strategy="lazyOnload" onLoad={initVdoPlayer} />
                <iframe
                  key={`vdo-${lessonId}-${initialProgress}`}
                  id="vdo-player-iframe"
                  src={`https://player.vdocipher.com/v2/?otp=${lesson.vdoCipherOtp}&playbackInfo=${lesson.vdoCipherPlaybackInfo}${initialProgress > 0 ? `&time=${initialProgress}` : ''}`}
                  className={styles.vdoFrame}
                  allowFullScreen
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  title={lesson.title}
                />
                {/* Multi-watermark overlaid on iframe */}
                <MultiWatermark label={userEmail} />
              </div>
            ) : (
              // Spinner trong khi chờ progress load
              <div className={styles.playerLoading}>
                <div className={styles.spinner} />
              </div>
            )
          ) : (
            /* ──── HTML5 PLAYER (fallback / demo videos) ──── */
            <div
              className={styles.playerWrapper}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => playing && setShowControls(false)}
              onClick={togglePlay}
              onContextMenu={(e) => e.preventDefault()}
            >
              <video
                ref={videoRef}
                key={lesson?.videoUrl || "empty"}
                src={lesson?.videoUrl || undefined}
                className={styles.video}
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                playsInline
                onContextMenu={(e) => e.preventDefault()}
                onEnded={() => {
                  handleComplete(lessonId);
                  if (nextLesson && !nextLesson.isLocked)
                    setTimeout(() => goToLesson(nextLesson.id), 1500);
                }}
              />
              {/* Multi-watermark on HTML5 player */}
              <MultiWatermark label={userEmail} />

              {/* Controls */}
              <div
                className={`${styles.controls} ${showControls ? styles.visible : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range" min={0} max={duration || 100} value={progress}
                  onChange={handleSeek} className={styles.seekBar}
                />
                <div className={styles.controlsRow}>
                  <div className={styles.leftControls}>
                    <button className={styles.ctrlBtn} disabled={!prevLesson}
                      onClick={() => prevLesson && goToLesson(prevLesson.id)}>
                      <RotateCcw size={18} />
                    </button>
                    <button className={`${styles.ctrlBtn} ${styles.playBtn}`} onClick={togglePlay}>
                      {playing ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button className={styles.ctrlBtn}
                      disabled={!nextLesson || nextLesson.isLocked}
                      onClick={() => nextLesson && !nextLesson.isLocked && goToLesson(nextLesson.id)}>
                      <ChevronRight size={18} />
                    </button>
                    <button className={styles.ctrlBtn} onClick={() => {
                      const v = videoRef.current; if (!v) return;
                      v.muted = !muted; setMuted(!muted);
                    }}>
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span className={styles.timeLabel}>{fmtTime(progress)} / {fmtTime(duration)}</span>
                  </div>
                  <div className={styles.rightControls}>
                    <button className={styles.ctrlBtn} onClick={() => videoRef.current?.requestFullscreen()}>
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>
              {!playing && (
                <div className={styles.centerPlay}><Play size={48} fill="white" /></div>
              )}
            </div>
          )}

          {/* Lesson info bar */}
          <div className={styles.lessonInfo}>
            <div className={styles.lessonMeta}>
              <span className={styles.chapterBreadcrumb}>{lesson?.chapterTitle}</span>
              <h1 className={styles.lessonTitle}>{lesson?.title}</h1>
            </div>
            <div className={styles.lessonNav}>
              <button className={styles.navBtn} disabled={!prevLesson}
                onClick={() => prevLesson && goToLesson(prevLesson.id)}>← Previous</button>
              {completedLessons.has(lessonId) ? (
                <span className={styles.completedBadge}><CheckCircle2 size={16} /> Completed</span>
              ) : (
                <button className={styles.markBtn} onClick={() => handleComplete(lessonId)}>
                  Mark as Complete
                </button>
              )}
              <button className={styles.navBtn}
                disabled={!nextLesson || nextLesson.isLocked}
                onClick={() => nextLesson && !nextLesson.isLocked && goToLesson(nextLesson.id)}>
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            {/* Tab switcher */}
            <div className={styles.tabBar}>
              <button
                className={`${styles.tabBtn} ${activeTab === "curriculum" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("curriculum")}
              >
                <BookOpen size={14} />
                Nội dung
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "chat" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                <MessageSquare size={14} />
                Chat
              </button>
            </div>

            {/* Tab: Curriculum */}
            {activeTab === "curriculum" && (
              <>
                <div className={styles.sidebarHeader}>
                  <h2 className={styles.sidebarTitle}>Course Content</h2>
                  <span className={styles.sidebarProgress}>{completedCount}/{totalLessons} completed</span>
                </div>
                <div className={styles.sidebarScroll}>
                  {curriculum.map((chapter) => {
                    const isCollapsed = collapsedChapters.has(chapter.id);
                    const isCurrentChapter = chapter.lessons.some((l) => l.id === lessonId);
                    return (
                      <div key={chapter.id} className={styles.chapterGroup}>
                        <button
                          className={`${styles.chapterHeader} ${isCurrentChapter ? styles.activeChapter : ""}`}
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <span className={styles.chapterName}>{chapter.orderIndex}. {chapter.title}</span>
                          <ChevronDown size={16} className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`} />
                        </button>
                        {!isCollapsed && (
                          <div className={styles.lessonItems}>
                            {chapter.lessons.map((l) => {
                              const isCurrent = l.id === lessonId;
                              const isDone = completedLessons.has(l.id);
                              return (
                                <button
                                  key={l.id}
                                  className={`${styles.lessonItem} ${isCurrent ? styles.currentLesson : ""} ${l.isLocked ? styles.lockedLesson : ""}`}
                                  onClick={() => !l.isLocked && goToLesson(l.id)}
                                  disabled={l.isLocked}
                                  title={l.isLocked ? "Purchase course to unlock" : l.title}
                                >
                                  <div className={styles.lessonItemIcon}>
                                    {l.isLocked ? <Lock size={13} />
                                      : isDone ? <CheckCircle2 size={13} className={styles.doneIcon} />
                                      : <Play size={11} />}
                                  </div>
                                  <div className={styles.lessonItemBody}>
                                    <span className={styles.lessonItemTitle}>{l.title}</span>
                                    <span className={styles.lessonItemMeta}>
                                      {l.isFreePreview && <span className={styles.previewTag}>Preview</span>}
                                      {l.durationSeconds ? `${Math.floor(l.durationSeconds / 60)}:${(l.durationSeconds % 60).toString().padStart(2, '0')}` : '0m'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Tab: Chat */}
            {activeTab === "chat" && (
              <div className={styles.chatContainer}>
                <LessonChat
                  lessonId={lessonId}
                  currentVideoTime={progress}
                  seekTo={seekTo}
                />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
