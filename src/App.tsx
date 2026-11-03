import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "./usePlayer";
import { tracks, albums, heroImage, formatTime } from "./data";
import type { Track } from "./types";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PrevIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  VolumeIcon,
  MuteIcon,
  HomeIcon,
  LibraryIcon,
  SearchIcon,
  QueueIcon,
  HeartIcon,
  HeartFilledIcon,
  XIcon,
} from "./icons";

type View = "home" | "library" | "search" | "queue" | "album";

export function App() {
  const player = usePlayer();
  const [view, setView] = useState<View>("home");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Dynamic accent from current track
  const accent = player.currentTrack?.accent || "#e8835a";
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty(
      "--accent-glow",
      accent + "26"
    );
  }, [accent]);

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setView("album");
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const albumTracks = selectedAlbum
    ? selectedAlbum.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter(Boolean) as Track[]
    : [];

  return (
    <div className="app">
      <Sidebar
        view={view}
        setView={(v) => {
          setView(v);
          if (v !== "album") setSelectedAlbumId(null);
        }}
      />
      <main className="main">
        <div className="main-header">
          <SearchBar
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              if (v) setView("search");
            }}
          />
        </div>
        {view === "home" && (
          <HomeView
            onPlayAll={() => player.playAll(tracks)}
            onOpenAlbum={openAlbum}
            onPlayTrack={player.playTrack}
          />
        )}
        {view === "library" && (
          <LibraryView onOpenAlbum={openAlbum} />
        )}
        {view === "search" && (
          <SearchResultsView
            results={searchResults}
            query={searchQuery}
            onPlayTrack={player.playTrack}
            likedIds={likedIds}
            onToggleLike={toggleLike}
            currentTrackId={player.currentTrack?.id}
          />
        )}
        {view === "album" && selectedAlbum && (
          <AlbumView
            album={selectedAlbum}
            tracks={albumTracks}
            onPlayAll={() => player.playAll(albumTracks)}
            onPlayTrack={player.playTrack}
            likedIds={likedIds}
            onToggleLike={toggleLike}
            currentTrackId={player.currentTrack?.id}
          />
        )}
        {view === "queue" && (
          <QueueView player={player} />
        )}
      </main>
      <PlayerBar player={player} toggleLike={toggleLike} likedIds={likedIds} />
    </div>
  );
}

/* ===== Sidebar ===== */
function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="3" fill="#fff" />
          </svg>
        </div>
        Sonora
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Menu</div>
        <NavButton
          icon={<HomeIcon />}
          label="Home"
          active={view === "home"}
          onClick={() => setView("home")}
        />
        <NavButton
          icon={<SearchIcon />}
          label="Search"
          active={view === "search"}
          onClick={() => setView("search")}
        />
        <NavButton
          icon={<LibraryIcon />}
          label="Library"
          active={view === "library"}
          onClick={() => setView("library")}
        />
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-section">
        <div className="sidebar-label">Playlists</div>
        <NavButton
          icon={<QueueIcon />}
          label="Play Queue"
          active={view === "queue"}
          onClick={() => setView("queue")}
        />
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-label">Albums</div>
        <div className="playlist-list">
          {albums.slice(0, 8).map((a) => (
            <button
              key={a.id}
              className="playlist-item"
              onClick={() => setView("library")}
              title={a.title}
            >
              <img
                className="playlist-item-cover"
                src={a.cover}
                alt=""
                loading="lazy"
              />
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {a.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

/* ===== Search bar ===== */
function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="search-bar">
      <SearchIcon size={18} />
      <input
        type="text"
        placeholder="Search songs, artists, albums..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ display: "flex", color: "var(--text-muted)" }}
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
}

/* ===== Home view ===== */
function HomeView({
  onPlayAll,
  onOpenAlbum,
  onPlayTrack,
}: {
  onPlayAll: () => void;
  onOpenAlbum: (id: string) => void;
  onPlayTrack: (t: Track) => void;
}) {
  const featured = albums.slice(0, 6);
  const recent = tracks.slice(0, 6);

  return (
    <div className="content">
      <div className="hero-banner">
        <img src={heroImage} alt="" />
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <div className="hero-banner-label">Featured Playlist</div>
          <div className="hero-banner-title">Late Night Sessions</div>
          <div className="hero-banner-subtitle">
            A curated mix of moody, atmospheric tracks for the small hours.
          </div>
          <button className="hero-play-btn" onClick={onPlayAll}>
            <PlayIcon size={18} /> Play All
          </button>
        </div>
      </div>

      <div className="section-title">Featured Albums</div>
      <div className="album-grid">
        {featured.map((a) => (
          <div
            key={a.id}
            className="album-card"
            onClick={() => onOpenAlbum(a.id)}
          >
            <div className="album-card-cover">
              <img src={a.cover} alt={a.title} loading="lazy" />
              <button
                className="album-card-play"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAlbum(a.id);
                }}
              >
                <PlayIcon size={20} />
              </button>
            </div>
            <div className="album-card-title">{a.title}</div>
            <div className="album-card-artist">{a.artist}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Recently Played</div>
      <div className="track-list">
        {recent.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            onPlay={() => onPlayTrack(t)}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== Library view ===== */
function LibraryView({
  onOpenAlbum,
}: {
  onOpenAlbum: (id: string) => void;
}) {
  return (
    <div className="content">
      <div className="page-title">Library</div>
      <div className="album-grid">
        {albums.map((a) => (
          <div
            key={a.id}
            className="album-card"
            onClick={() => onOpenAlbum(a.id)}
          >
            <div className="album-card-cover">
              <img src={a.cover} alt={a.title} loading="lazy" />
              <button
                className="album-card-play"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAlbum(a.id);
                }}
              >
                <PlayIcon size={20} />
              </button>
            </div>
            <div className="album-card-title">{a.title}</div>
            <div className="album-card-artist">
              {a.artist} · {a.year}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Album detail view ===== */
function AlbumView({
  album,
  tracks: albumTracks,
  onPlayAll,
  onPlayTrack,
  likedIds,
  onToggleLike,
  currentTrackId,
}: {
  album: (typeof albums)[number];
  tracks: Track[];
  onPlayAll: () => void;
  onPlayTrack: (t: Track) => void;
  likedIds: Set<string>;
  onToggleLike: (id: string) => void;
  currentTrackId?: string;
}) {
  return (
    <div className="content">
      <div
        style={{
          display: "flex",
          gap: 28,
          alignItems: "flex-end",
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <img
          src={album.cover}
          alt={album.title}
          style={{
            width: 200,
            height: 200,
            borderRadius: "16px",
            objectFit: "cover",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            Album · {album.year}
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            {album.title}
          </div>
          <div style={{ fontSize: 16, color: "var(--text-secondary)" }}>
            {album.artist}
          </div>
          <button
            className="hero-play-btn"
            style={{ marginTop: 20 }}
            onClick={onPlayAll}
          >
            <PlayIcon size={18} /> Play Album
          </button>
        </div>
      </div>

      <div className="track-list">
        {albumTracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            onPlay={() => onPlayTrack(t)}
            isPlaying={currentTrackId === t.id}
            isLiked={likedIds.has(t.id)}
            onLike={() => onToggleLike(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== Search results ===== */
function SearchResultsView({
  results,
  query,
  onPlayTrack,
  likedIds,
  onToggleLike,
  currentTrackId,
}: {
  results: Track[] | null;
  query: string;
  onPlayTrack: (t: Track) => void;
  likedIds: Set<string>;
  onToggleLike: (id: string) => void;
  currentTrackId?: string;
}) {
  return (
    <div className="search-results">
      {results === null ? (
        <div className="no-results">Start typing to search...</div>
      ) : results.length === 0 ? (
        <div className="no-results">
          No results found for "{query}"
        </div>
      ) : (
        <>
          <div className="page-title">
            Results for "{query}"
          </div>
          <div className="track-list">
            {results.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                onPlay={() => onPlayTrack(t)}
                isPlaying={currentTrackId === t.id}
                isLiked={likedIds.has(t.id)}
                onLike={() => onToggleLike(t.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Track row ===== */
function TrackRow({
  track,
  index,
  onPlay,
  isPlaying,
  isLiked,
  onLike,
}: {
  track: Track;
  index: number;
  onPlay: () => void;
  isPlaying?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
}) {
  return (
    <div
      className={`track-row ${isPlaying ? "playing" : ""}`}
      onClick={onPlay}
      style={{ cursor: "pointer" }}
    >
      <div className="track-num-wrapper">
        <span className="track-num">{index + 1}</span>
        <span className="track-play-icon" onClick={(e) => e.stopPropagation()}>
          <PlayIcon size={14} />
        </span>
      </div>
      <div className="track-info">
        <img className="track-cover" src={track.cover} alt="" loading="lazy" />
        <div style={{ minWidth: 0 }}>
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
      </div>
      <div className="track-album-name">{track.album}</div>
      <div className="track-duration">{formatTime(track.duration)}</div>
      {onLike && (
        <button
          className={`track-like-btn ${isLiked ? "liked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
        >
          {isLiked ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
        </button>
      )}
    </div>
  );
}

/* ===== Queue view ===== */
function QueueView({ player }: { player: ReturnType<typeof usePlayer> }) {
  return (
    <div className="queue-view">
      <div className="queue-header">
        <div className="page-title">Play Queue</div>
        {player.queue.length > 0 && (
          <button
            className="hero-play-btn"
            style={{ padding: "10px 24px", fontSize: 13 }}
            onClick={() => {
              if (player.currentIndex < player.queue.length) {
                player.togglePlay();
              } else {
                player.playQueueIndex(0);
              }
            }}
          >
            <PlayIcon size={16} /> Resume
          </button>
        )}
      </div>
      {player.queue.length === 0 ? (
        <div className="queue-empty">
          Your queue is empty. Play a song to get started.
        </div>
      ) : (
        <div className="queue-list">
          {player.queue.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className={`queue-row ${i === player.currentIndex ? "current" : ""}`}
              onClick={() => player.playQueueIndex(i)}
              style={{ cursor: "pointer" }}
            >
              <div className="queue-index">
                {i === player.currentIndex && player.isPlaying ? (
                  <NowPlayingBars />
                ) : (
                  i + 1
                )}
              </div>
              <img className="queue-cover" src={t.cover} alt="" loading="lazy" />
              <div className="queue-title">{t.title}</div>
              <div className="queue-artist">{t.artist}</div>
              <div className="queue-duration">{formatTime(t.duration)}</div>
              <button
                className="queue-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  player.removeFromQueue(i);
                }}
              >
                <XIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NowPlayingBars() {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        alignItems: "flex-end",
        justifyContent: "center",
        height: 16,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: "100%",
            background: "var(--accent)",
            borderRadius: 2,
            animation: `bar-pulse 800ms ease-in-out ${i * 200}ms infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ===== Player bar ===== */
function PlayerBar({
  player,
  toggleLike,
  likedIds,
}: {
  player: ReturnType<typeof usePlayer>;
  toggleLike: (id: string) => void;
  likedIds: Set<string>;
}) {
  const t = player.currentTrack;
  const isLiked = t ? likedIds.has(t.id) : false;
  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="player-bar">
      {/* Left: track info */}
      <div className="player-track-info">
        {t ? (
          <>
            <img className="player-track-cover" src={t.cover} alt="" />
            <div className="player-track-text">
              <div className="player-track-title">{t.title}</div>
              <div className="player-track-artist">{t.artist}</div>
            </div>
            <button
              className={`track-like-btn ${isLiked ? "liked" : ""}`}
              style={{ opacity: 1, marginLeft: 8 }}
              onClick={() => toggleLike(t.id)}
            >
              {isLiked ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
            </button>
          </>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No track playing
          </div>
        )}
      </div>

      {/* Center: controls + progress */}
      <div className="player-controls">
        <div className="player-buttons">
          <button
            className="ctrl-btn"
            onClick={player.toggleShuffle}
            style={player.isShuffled ? { color: "var(--accent)" } : {}}
          >
            <ShuffleIcon size={18} />
          </button>
          <button className="ctrl-btn" onClick={player.prev} disabled={!t}>
            <PrevIcon size={20} />
          </button>
          <button
            className="ctrl-btn play-main"
            onClick={player.togglePlay}
            disabled={!t}
          >
            {player.isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button className="ctrl-btn" onClick={player.next} disabled={!t}>
            <NextIcon size={20} />
          </button>
          <button
            className="ctrl-btn"
            onClick={player.cycleRepeat}
            style={player.repeatMode !== "off" ? { color: "var(--accent)" } : {}}
          >
            {player.repeatMode === "one" ? (
              <RepeatOneIcon size={18} />
            ) : (
              <RepeatIcon size={18} />
            )}
          </button>
        </div>
        <div className="player-progress">
          <span className="progress-time">
            {formatTime(player.currentTime)}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={player.duration || 0}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              disabled={!t}
            />
          </div>
          <span className="progress-time">
            {formatTime(player.duration)}
          </span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="player-right">
        <button className="ctrl-btn" onClick={player.toggleMute}>
          {player.isMuted || player.volume === 0 ? (
            <MuteIcon size={18} />
          ) : (
            <VolumeIcon size={18} />
          )}
        </button>
        <div className="volume-control">
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={player.isMuted ? 0 : player.volume}
            onChange={(e) => {
              player.setVolume(Number(e.target.value));
              if (player.isMuted) player.toggleMute();
            }}
          />
        </div>
      </div>
    </div>
  );
}
