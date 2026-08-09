import { useState } from 'react';

const DEFAULT_EMBED_SRC = 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0';
const SPOTIFY_LINK_PATTERN = /open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/;

export function SpotifyPanel() {
  const [embedSrc, setEmbedSrc] = useState(DEFAULT_EMBED_SRC);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  function handleLoad() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const match = trimmed.match(SPOTIFY_LINK_PATTERN);
    if (!match) {
      setError("That doesn't look like a Spotify playlist, album, or track link.");
      return;
    }
    setError('');
    setEmbedSrc(`https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`);
  }

  return (
    <div className="glass-panel">
      <div className="panel-title">Now Playing</div>
      <div className="spotify-swap">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste a Spotify playlist link..."
        />
        <button type="button" onClick={handleLoad}>Load</button>
      </div>
      {error && <p className="focus-spotify-error">{error}</p>}
      <iframe
        title="Spotify player"
        style={{ borderRadius: 12 }}
        src={embedSrc}
        width="100%"
        height={152}
        frameBorder={0}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
