import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { AudioWaveform } from './AudioWaveform';

const PEAKS = Array.from({ length: 32 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i)));

// A valid, self-contained WAV source for the a11y audits.
const TINY_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

// jsdom does not implement HTMLMediaElement playback — model just enough of it
// that play/pause flips `paused` and dispatches the events our component listens for.
let paused = true;
beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get() {
      return paused;
    },
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value(this: HTMLMediaElement) {
      paused = false;
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    },
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value(this: HTMLMediaElement) {
      paused = true;
      this.dispatchEvent(new Event('pause'));
    },
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    configurable: true,
    get(this: HTMLMediaElement & { __ct?: number }) {
      return this.__ct ?? 0;
    },
    set(this: HTMLMediaElement & { __ct?: number }, v: number) {
      this.__ct = v;
    },
  });
});
beforeEach(() => {
  paused = true;
});

describe('AudioWaveform', () => {
  it('reveals the label, a play button, and a scrubber slider', () => {
    render(<AudioWaveform src="clip.wav" label="Clip A" peaks={PEAKS} duration={120} />);
    expect(screen.getByRole('button', { name: 'Play Clip A' })).toBeInTheDocument();
    // Tone is paired with a word — the label text is always rendered.
    expect(screen.getByText('Clip A')).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: 'Seek — Clip A' });
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '120');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('never autoplays — idle until the user acts', () => {
    const onPlay = vi.fn();
    render(
      <AudioWaveform src="clip.wav" label="Clip A" peaks={PEAKS} duration={120} onPlay={onPlay} />,
    );
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Play/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles play/pause with aria-pressed and fires callbacks', async () => {
    const user = userEvent.setup();
    const onPlay = vi.fn();
    const onPause = vi.fn();
    render(
      <AudioWaveform
        src="clip.wav"
        label="Clip A"
        peaks={PEAKS}
        duration={120}
        onPlay={onPlay}
        onPause={onPause}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Play Clip A' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    await user.click(btn);
    expect(onPlay).toHaveBeenCalledTimes(1);
    const pauseBtn = screen.getByRole('button', { name: 'Pause Clip A' });
    expect(pauseBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(pauseBtn);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Play Clip A' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('seeks with the keyboard and clamps to the duration', () => {
    render(<AudioWaveform src="clip.wav" label="Clip A" peaks={PEAKS} duration={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '5');
    expect(slider).toHaveAttribute('aria-valuetext', '0:05 of 2:00');

    fireEvent.keyDown(slider, { key: 'PageUp' });
    expect(slider).toHaveAttribute('aria-valuenow', '15');

    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider).toHaveAttribute('aria-valuenow', '120');
    expect(slider).toHaveAttribute('aria-valuetext', '2:00 of 2:00');

    // Past the end clamps rather than overflowing.
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '120');

    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders compact mode as a presentational thumbnail with no controls', () => {
    render(<AudioWaveform src="clip.wav" label="Thumb" peaks={PEAKS} compact />);
    expect(screen.getByRole('img', { name: 'Thumb' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('marks a dormant placeholder when no peaks are supplied', () => {
    const { container } = render(<AudioWaveform src="clip.wav" label="No peaks" duration={10} />);
    expect(container.querySelector('.tcl-audio-waveform')).toHaveAttribute('data-placeholder');
  });

  it('treats an empty peaks array as a dormant placeholder, not real data', () => {
    const { container } = render(
      <AudioWaveform src="clip.wav" label="Empty" peaks={[]} duration={10} />,
    );
    expect(container.querySelector('.tcl-audio-waveform')).toHaveAttribute('data-placeholder');
  });

  it('keeps valuenow, valuemax and valuetext consistent at the end of a non-integer duration', () => {
    render(<AudioWaveform src="clip.wav" label="Clip" peaks={PEAKS} duration={12.7} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', '12');
    fireEvent.keyDown(slider, { key: 'End' });
    // At the true end the announced position reaches the max — no off-by-one
    // between a floored valuenow and a rounded valuemax.
    expect(slider.getAttribute('aria-valuenow')).toBe(slider.getAttribute('aria-valuemax'));
    expect(slider).toHaveAttribute('aria-valuetext', '0:12 of 0:12');
  });

  it('treats a NaN duration as unknown instead of corrupting state', () => {
    render(<AudioWaveform src="clip.wav" label="Clip" peaks={PEAKS} duration={NaN} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', '0');
    // The NaN must not slip past the seek guard and poison currentTime.
    expect(() => fireEvent.keyDown(slider, { key: 'ArrowRight' })).not.toThrow();
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('falls back to metadata duration when the duration prop is a non-positive placeholder', () => {
    const { container } = render(
      <AudioWaveform src="clip.wav" label="Clip" peaks={PEAKS} duration={0} />,
    );
    const audio = container.querySelector('audio') as HTMLAudioElement;
    Object.defineProperty(audio, 'duration', { configurable: true, value: 42 });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '42');
  });

  it('has no axe violations (player)', async () => {
    const { container } = render(
      <AudioWaveform src={TINY_WAV} label="Accessible clip" peaks={PEAKS} duration={30} />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations (compact)', async () => {
    const { container } = render(
      <AudioWaveform src="clip.wav" label="Accessible thumbnail" peaks={PEAKS} compact />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
