import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioWaveform } from './AudioWaveform';

/** A short, self-contained tone so the transport is genuinely playable in the docs. */
function makeToneWav(seconds = 2, freq = 220): string {
  const sr = 8000;
  const n = Math.floor(sr * seconds);
  const bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const wr = (off: number, s: string): void => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  wr(0, 'RIFF');
  view.setUint32(4, 36 + n, true);
  wr(8, 'WAVE');
  wr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  wr(36, 'data');
  view.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.max(0, Math.min(1, t * 4, (seconds - t) * 4));
    const s = Math.sin(2 * Math.PI * freq * t) * 0.25 * env;
    bytes[44 + i] = Math.max(0, Math.min(255, Math.round((s + 1) * 127.5)));
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/** Deterministic, nice-looking amplitude bars for the demos. */
function genPeaks(n: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI);
    const wobble = 0.45 + 0.55 * Math.abs(Math.sin(i * 0.7 + seed) * Math.cos(i * 0.13 + seed));
    out.push(Math.max(0.06, env * wobble));
  }
  const max = Math.max(...out) || 1;
  return out.map((v) => v / max);
}

const TONE_SRC = makeToneWav(8, 220);
const PEAKS_A = genPeaks(96, 1.2);
const PEAKS_B = genPeaks(72, 4.8);

/**
 * An audio preview + player: an amplitude bar-rail waveform with a played/unplayed
 * split, a play/pause transport, and a keyboard-operable scrubber. Lead job is
 * **reveal state** — the waveform, the mono time readout, and loading / decode-error
 * status; it never autoplays on mount (only a user gesture starts sound).
 *
 * ### When to use it
 * - Previewing and playing an audio asset inline: sound-effect libraries, voice
 *   takes, ambient loops, message attachments.
 * - `compact` for a waveform-only thumbnail in dense grids (no transport, no scrubber).
 * - Not for video or captioned media — this is an audio-only preview surface.
 *
 * ### Data & key props
 * - `src` — audio URL or data URI (required).
 * - `label` — the accessible name for the player and its scrubber (required).
 * - `peaks` — pre-computed normalized (0–1) amplitude bars; omit and set
 *   `autoLoadPeaks` to decode real peaks from `src` via the Web Audio API, else a
 *   dormant placeholder renders.
 * - `duration` — track length in seconds; falls back to the audio element's metadata.
 * - `playOnClick` (default `true`) — a pointer click/tap or drag-release on the
 *   waveform seeks AND starts playback; set `false` to make pointer seeks move the
 *   playhead only. Keyboard seeks never auto-play regardless.
 * - `tone` (default `accent`) · `compact` · `onPlay` / `onPause`.
 *
 * ### Accessibility
 * - The transport is a real `<button>` with `aria-pressed` and a "Play/Pause {label}"
 *   name; the scrubber is `role="slider"` with `aria-valuemin/max/now/valuetext`.
 * - Keyboard on the scrubber: Arrow keys step 5s, PageUp/PageDown 10s, Home/End jump.
 * - Loading and decode-error are announced through a `role="status"` `aria-live`
 *   region and shown as text; tone is always paired with the visible label.
 * - `compact` renders as a labelled `role="img"`; playhead motion is CSS behind
 *   `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - `tone` recolors the waveform via status tokens; works in light · dark · reliquary
 *   via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/AudioWaveform',
  component: AudioWaveform,
  args: {
    src: TONE_SRC,
    label: 'Ambient loop 01.wav',
    peaks: PEAKS_A,
    duration: 8,
    tone: 'accent',
  },
} satisfies Meta<typeof AudioWaveform>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — a real play/pause button (aria-pressed) plus a
 * keyboard-operable scrubber. Click Play to hear the embedded tone.
 */
export const Default: Story = {};

/**
 * Job: Reveal State — the waveform, the played/unplayed split, and the
 * loading / decode-error states (announced via aria-live). Tone is always
 * paired with the label text.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 440 }}>
      <AudioWaveform
        src={TONE_SRC}
        label="Ready — with peaks"
        peaks={PEAKS_A}
        duration={8}
        tone="accent"
      />
      <AudioWaveform
        src={TONE_SRC}
        label="Success tone"
        peaks={PEAKS_B}
        duration={8}
        tone="success"
      />
      <AudioWaveform
        src={TONE_SRC}
        label="Warning tone"
        peaks={PEAKS_B}
        duration={8}
        tone="warning"
      />
      <AudioWaveform
        src={TONE_SRC}
        label="No peaks — dormant placeholder"
        duration={8}
        tone="info"
      />
      <AudioWaveform
        src="data:audio/wav;base64,AAAA"
        label="Decode error"
        autoLoadPeaks
        tone="danger"
      />
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ width: 120 }}>
          <AudioWaveform
            src={TONE_SRC}
            label="Compact thumbnail"
            peaks={PEAKS_A}
            compact
            tone="accent"
          />
        </div>
        <span
          style={{
            font: 'var(--tcl-text-sm)/1.4 var(--tcl-font-sans)',
            color: 'var(--tcl-text-dim)',
          }}
        >
          ← compact (waveform-only)
        </span>
      </div>
    </div>
  ),
};

/**
 * Job: Acknowledge Input — click (or tap) anywhere on the waveform to seek
 * there AND start playback from that point; drag to scrub and release to play
 * from where you land. Or seek with the keyboard (focus the waveform, then
 * Arrow keys / Home / End / PageUp-Down) — keyboard seeks move the playhead
 * WITHOUT auto-playing. Never autoplays on mount.
 */
export const Interaction: Story = {
  args: {
    label: 'Click to play from here — or drag / arrow-key',
    peaks: PEAKS_B,
    duration: 8,
    tone: 'accent',
  },
};

/**
 * Job: Acknowledge Input — opt out of click-to-play with `playOnClick={false}`:
 * a pointer click/tap still seeks (moving the playhead), but never starts
 * playback — use the play button to begin sound. Keyboard seeks behave
 * identically to the default.
 */
export const SeekOnly: Story = {
  args: {
    label: 'Seek only — click won’t auto-play',
    peaks: PEAKS_A,
    duration: 8,
    tone: 'info',
    playOnClick: false,
  },
};
