"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { siteConfig } from "../siteConfig";

type PlayMode = "loop" | "single" | "random";
type LyricLine = { time: number; text: string };
type Song = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl?: string;
  lyrics?: LyricLine[];
};

interface MusicContextType {
  playlist: Song[];
  currentIndex: number;
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);
const METING_DIRECT_API = "https://api.injahow.cn/meting/";

type RawSongMeta = {
  id?: string | number;
  name?: string;
  title?: string;
  artist?: string;
  author?: string;
  url?: string;
  pic?: string;
  cover?: string;
  lrc?: string;
};

function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || lrcText.length > 30000) return [];
  const result: LyricLine[] = [];
  for (const line of lrcText.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (!matches.length) continue;
    const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, "").trim();
    if (!text) continue;
    for (const match of matches) {
      const min = Number(match[1]);
      const sec = Number(match[2]);
      const ms = match[3] ? Number(match[3]) : 0;
      const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
      result.push({ time: min * 60 + sec + ms / divisor, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

function extractIdFromMetingUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get("id");
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

async function fetchSongMetaWithFallback(id: string): Promise<{ data: RawSongMeta[]; useProxy: boolean }> {
  const safeId = encodeURIComponent(id);
  const proxyUrl = `/api/music?id=${safeId}&type=meta`;
  const directUrl = `${METING_DIRECT_API}?server=netease&type=song&id=${safeId}`;

  try {
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const proxyData = (await proxyRes.json().catch(() => null)) as RawSongMeta[] | null;
      if (Array.isArray(proxyData) && proxyData.length > 0) {
        return { data: proxyData, useProxy: true };
      }
    }
  } catch {
    // fallback to direct API
  }

  const directRes = await fetch(directUrl);
  if (!directRes.ok) {
    throw new Error(`Music meta fetch failed: ${id}`);
  }
  const directData = (await directRes.json().catch(() => null)) as RawSongMeta[] | null;
  if (!Array.isArray(directData) || directData.length === 0) {
    throw new Error(`Music meta empty: ${id}`);
  }
  return { data: directData, useProxy: false };
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接音乐...");
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const items = await Promise.all(
          (siteConfig.cloudMusicIds || []).map(async (id) => {
            const meta = await fetchSongMetaWithFallback(id);
            return { id, ...meta };
          })
        );

        const nextPlaylist = items
          .filter((x) => Array.isArray(x.data) && x.data.length > 0)
          .map(({ id, data, useProxy }) => {
            const song = data[0];
            const sourceSongId = String(song.id || id);
            const coverId = extractIdFromMetingUrl(song.pic || song.cover) || sourceSongId;
            const directAudio = song.url || `${METING_DIRECT_API}?server=netease&type=url&id=${encodeURIComponent(sourceSongId)}`;
            const directCover = song.pic || song.cover || `${METING_DIRECT_API}?server=netease&type=pic&id=${encodeURIComponent(coverId)}`;
            const directLrc = song.lrc || `${METING_DIRECT_API}?server=netease&type=lrc&id=${encodeURIComponent(sourceSongId)}`;

            return {
              id: sourceSongId,
              title: song.name || song.title || "未知歌曲",
              artist: song.author || song.artist || "未知歌手",
              cover: useProxy ? `/api/music?id=${encodeURIComponent(coverId)}&type=pic` : directCover,
              src: useProxy ? `/api/music?id=${encodeURIComponent(sourceSongId)}&type=audio` : directAudio,
              lrcUrl: useProxy ? `/api/music?id=${encodeURIComponent(sourceSongId)}&type=lrc` : directLrc,
              lyrics: [],
            } as Song;
          });

        if (!alive) return;
        setPlaylist(nextPlaylist);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setPlaylist([]);
        setCurrentLyric("音乐加载失败");
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const song = playlist[currentIndex];
    if (!song) return;

    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      setLyrics([]);
      setCurrentLyric("正在缓冲...");
    });

    if (song.lrcUrl) {
      fetch(song.lrcUrl)
        .then((res) => res.text())
        .then((text) => {
          if (!alive) return;
          const parsed = parseLrc(text);
          setLyrics(parsed);
          setPlaylist((prev) => prev.map((item, idx) => (idx === currentIndex ? { ...item, lyrics: parsed } : item)));
        })
        .catch(() => {
          if (alive) setCurrentLyric("纯享音乐");
        });
    }

    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.load();
      audio.play().catch(() => setIsPlaying(false));
    }

    return () => {
      alive = false;
    };
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    audio.load();
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const nextSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") setCurrentIndex(Math.floor(Math.random() * playlist.length));
    else setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevSong = () => {
    if (!playlist.length) return;
    if (playMode === "random") setCurrentIndex(Math.floor(Math.random() * playlist.length));
    else setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const playSong = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const { currentTime, duration } = audio;
    setCurrentTime(currentTime);
    setDuration(duration || 0);
    setProgress((currentTime / (duration || 1)) * 100);

    if (lyrics.length > 0) {
      const active = [...lyrics].reverse().find((l) => currentTime >= l.time);
      if (active) setCurrentLyric(active.text);
    }
  };

  const handleEnded = () => {
    if (playMode === "single") {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    nextSong();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setProgress(value);
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (value / 100) * audio.duration;
    }
  };

  const setVolume = (value: number) => {
    setVolumeState(value);
    if (isMuted && value > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((v) => !v);

  const togglePlayMode = () => {
    setPlayMode((prev) => (prev === "loop" ? "single" : prev === "single" ? "random" : "loop"));
  };

  const currentSong = playlist[currentIndex] || null;

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentIndex,
        currentSong,
        isPlaying,
        progress,
        currentTime,
        duration,
        currentLyric,
        isLoading,
        volume,
        isMuted,
        playMode,
        togglePlay,
        nextSong,
        prevSong,
        handleSeek,
        playSong,
        setVolume,
        toggleMute,
        togglePlayMode,
      }}
    >
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          crossOrigin="anonymous"
          preload="auto"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
