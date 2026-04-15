import { useEffect, useRef, useState } from "react";

interface OpeningCinematicProps {
  videoUrl: string;
  onComplete: () => void;
}

type PlayState = "loading" | "playing" | "blocked";

export default function OpeningCinematic({ videoUrl, onComplete }: OpeningCinematicProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [playState, setPlayState] = useState<PlayState>("loading");

  const triggerComplete = () => {
    setFadeOut(true);
    setTimeout(() => onComplete(), 600);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => triggerComplete();
    video.addEventListener("ended", handleEnded);

    // 3초 안에 재생 시작 안 되면 blocked로 전환
    const timeout = setTimeout(() => {
      setPlayState((prev) => (prev === "loading" ? "blocked" : prev));
    }, 3000);

    video.play()
      .then(() => {
        clearTimeout(timeout);
        setPlayState("playing");
      })
      .catch(() => {
        clearTimeout(timeout);
        setPlayState("blocked");
      });

    return () => {
      clearTimeout(timeout);
      video.removeEventListener("ended", handleEnded);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClickToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play()
      .then(() => setPlayState("playing"))
      .catch(() => triggerComplete());
  };

  return (
    <div
      onClick={playState === "blocked" ? handleClickToPlay : undefined}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        cursor: playState === "blocked" ? "pointer" : "default",
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: playState === "playing" ? "block" : "none",
        }}
        muted
        playsInline
        preload="auto"
      />

      {/* 로딩 중 */}
      {playState === "loading" && (
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: "16px", fontSize: "15px", opacity: 0.8 }}>로딩 중...</p>
        </div>
      )}

      {/* autoplay 차단됨 */}
      {playState === "blocked" && (
        <div style={{ textAlign: "center", color: "#fff", userSelect: "none" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>▶</div>
          <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
            화면을 클릭해서 영상 재생
          </p>
          <p style={{ fontSize: "13px", opacity: 0.6, marginBottom: "24px" }}>
            브라우저 설정으로 자동 재생이 차단됐습니다
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerComplete();
            }}
            style={{
              padding: "8px 24px",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              backdropFilter: "blur(4px)",
            }}
          >
            Skip
          </button>
        </div>
      )}

      {/* 재생 중 Skip 버튼 */}
      {playState === "playing" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerComplete();
          }}
          style={{
            position: "absolute",
            bottom: "32px",
            right: "32px",
            padding: "8px 20px",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            backdropFilter: "blur(4px)",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}

const spinnerStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  border: "3px solid rgba(255,255,255,0.2)",
  borderTop: "3px solid #fff",
  borderRadius: "50%",
  animation: "spin 0.9s linear infinite",
  margin: "0 auto",
};

// 스피너 keyframe을 head에 주입
if (typeof document !== "undefined") {
  const styleId = "opening-cinematic-spin";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}
