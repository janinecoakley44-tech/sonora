import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "./types";
import { tracks } from "./data";

export type RepeatMode = "off" | "all" | "one";

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnd = () => handleEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnded = useCallback(() => {
    setCurrentIndex((prev) => {
      if (repeatMode === "one") {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        return prev;
      }
      if (prev + 1 < queue.length) return prev + 1;
      if (repeatMode === "all") return 0;
      setIsPlaying(false);
      return prev;
    });
  }, [queue.length, repeatMode]);

  // Reload src when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.url;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const playTrack = useCallback((track: Track) => {
    const idx = queue.findIndex((t) => t.id === track.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setIsPlaying(true);
    } else {
      setQueue((q) => [...q, track]);
      setCurrentIndex(queue.length);
      setIsPlaying(true);
    }
  }, [queue]);

  const playAll = useCallback(
    (list: Track[], startIndex = 0) => {
      if (list.length === 0) return;
      let playList = list;
      if (isShuffled) {
        playList = [...list].sort(() => Math.random() - 0.5);
      }
      setQueue(playList);
      setCurrentIndex(startIndex);
      setIsPlaying(true);
    },
    [isShuffled]
  );

  const playQueueIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((q) => {
        const newList = q.filter((_, i) => i !== index);
        if (index < currentIndex) {
          setCurrentIndex((ci) => ci - 1);
        } else if (index === currentIndex) {
          setIsPlaying(false);
          setCurrentIndex(-1);
        } else if (index < currentIndex) {
          // already handled
        }
        return newList;
      });
    },
    [currentIndex]
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    setCurrentIndex((prev) => {
      if (prev + 1 < queue.length) return prev + 1;
      if (repeatMode === "all") return 0;
      return prev;
    });
    setIsPlaying(true);
  }, [queue.length, repeatMode]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentIndex((p) => (p > 0 ? p - 1 : 0));
    setIsPlaying(true);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((s) => !s);
  }, []);

  return {
    queue,
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isLoading,
    allTracks: tracks,
    playTrack,
    playAll,
    playQueueIndex,
    removeFromQueue,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    cycleRepeat,
    toggleShuffle,
  };
}

export type PlayerAPI = ReturnType<typeof usePlayer>;
