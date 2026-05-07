"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Lock, Play, CheckCircle2, Volume2, VolumeX,
  Maximize, Pause, RotateCcw,
} from "lucide-react";
import styles from "./page.module.css";

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
  const lastSavedTimeRef = useRef(0);
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
    fetch(`http://localhost:5149/api/lessons/course/${courseId}`, {
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
    lastSavedTimeRef.current = 0;

    Promise.all([
      fetch(`http://localhost:5149/api/lessons/${lessonId}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`http://localhost:5149/api/progress/${lessonId}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : { watchedSeconds: 0 })
    ])
    .then(([lessonData, progressData]) => {
      setLesson(lessonData);
      if (progressData?.watchedSeconds > 0) {
        setInitialProgress(progressData.watchedSeconds);
        setProgress(progressData.watchedSeconds);
      }
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [lessonId, authHeaders]);

  /* Save progress function */
  const saveProgress = useCallback((currentTime: number, isCompleted: boolean) => {
    fetch("http://localhost:5149/api/progress/update", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: Math.floor(currentTime),
        isCompleted
      })
    }).catch(console.error);
  }, [lessonId, authHeaders]);

  const handleComplete = useCallback((id: number) => {
    setCompletedLessons((prev) => {
      if (prev.has(id)) return prev;
      const s = new Set(prev); s.add(id); return s;
    });
    fetch(`http://localhost:5149/api/lessons/${id}/complete`, {
      method: "POST", headers: authHeaders(),
    }).catch(console.error);
  }, [authHeaders]);

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

      player.video.addEventListener("timeupdate", () => {
        const time = player.video.currentTime;
        const dur = player.video.duration;
        setProgress(time);

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

  /* HTML5 video listeners */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setProgress(v.currentTime);
      if (v.duration && v.currentTime / v.duration > 0.9) handleComplete(lessonId);
    };
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [lesson?.videoUrl, handleComplete, lessonId]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
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
        <div className={styles.videoArea}>
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
            <div className={styles.vdoWrapper}>
              <Script src="https://player.vdocipher.com/v2/api.js" strategy="lazyOnload" onLoad={initVdoPlayer} />
              <iframe
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
          </aside>
        )}
      </div>
    </div>
  );
}
