import { useState } from 'react';
import type { HTMLAttributes } from 'react';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Avatar.css';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Image URL. Falls back to initials, then a glyph, on error or absence. */
  src?: string;
  /** Accessible name. Falls back to `name`. */
  alt?: string;
  /** Person/entity name — used for initials and as the accessible name. */
  name?: string;
  /** Avatar size on the fixed scale (default `md`). */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Outline shape (default `circle`). */
  shape?: 'circle' | 'square';
  /** Tints the initials fallback via the color-coded ontology (default `neutral`). */
  tone?: StatusTone;
}

function initialsFrom(name: string | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  tone = 'neutral',
  className,
  ...rest
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initials = initialsFrom(name);
  const label = alt ?? name ?? undefined;
  // With no identity to announce, the avatar is decorative (avoids an empty name).
  const decorative = !label;

  return (
    <span
      className={cx(
        'tcl-avatar',
        `tcl-avatar--${size}`,
        `tcl-avatar--${shape}`,
        !showImage && `tcl-avatar--tone-${tone}`,
        className,
      )}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative || undefined}
      {...rest}
    >
      {showImage ? (
        <img className="tcl-avatar__img" src={src} alt="" onError={() => setFailed(true)} />
      ) : initials ? (
        <span className="tcl-avatar__initials" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <svg
          className="tcl-avatar__fallback"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v1h16v-1c0-3.3-3.6-6-8-6Z" />
        </svg>
      )}
    </span>
  );
}
