import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getPreview, isPreviewing, PREVIEW_CONTROLS, resetPreview, setPreview, subscribePreview } from './preview';

export function usePreview() {
  return useSyncExternalStore(subscribePreview, getPreview);
}

const IST_MS = 5.5 * 3600000;

function istParts(date) {
  const d = new Date(date.getTime() + IST_MS);
  return { ymd: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function fromIst(ymd, minutes) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_MS + minutes * 60000);
}

function clock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
}

function TimeControl({ value }) {
  const { ymd, minutes } = istParts(value ?? new Date());
  return (
    <div className="pv-time">
      <div className="pv-row-head">
        <span>{value ? clock(minutes) : 'Live'}</span>
        {value ? (
          <button type="button" className="pv-live" onClick={() => setPreview({ time: null })}>
            Live
          </button>
        ) : null}
      </div>
      <input
        type="range"
        min="0"
        max="1439"
        step="5"
        value={minutes}
        aria-label="Time of day"
        onChange={(e) => setPreview({ time: fromIst(ymd, Number(e.target.value)) })}
      />
      <input
        type="date"
        value={ymd}
        aria-label="Date"
        onChange={(e) => e.target.value && setPreview({ time: fromIst(e.target.value, minutes) })}
      />
    </div>
  );
}

function ChoiceControl({ control, value }) {
  return (
    <select
      value={value ?? ''}
      aria-label={control.label}
      onChange={(e) => {
        const v = e.target.value || null;
        // Clearing the weather also clears its cloud-cover override.
        setPreview(control.key === 'weather' && !v ? { weather: null, cloud: null } : { [control.key]: v });
      }}
    >
      <option value="">Live</option>
      {control.options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function RangeControl({ control, value }) {
  const current = value ?? Math.round((control.max - control.min) / 2);
  return (
    <div className="pv-range">
      <input
        type="range"
        min={control.min}
        max={control.max}
        value={current}
        aria-label={control.label}
        onChange={(e) => setPreview({ [control.key]: Number(e.target.value) })}
      />
      <span>
        {current}
        {control.unit}
      </span>
    </div>
  );
}

// Small gear in the top bar that opens the preview controls.
export default function PreviewPanel() {
  const state = usePreview();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="pv" ref={wrapRef}>
      <button
        type="button"
        className={`pv-gear${isPreviewing() ? ' on' : ''}`}
        aria-label="Preview settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M3 0h3v1h1v1h1v1h1v3h-1v1h-1v1h-1v1h-3v-1h-1v-1h-1v-1h-1v-3h1v-1h1v-1h1zM3 3v3h3v-3z" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div className="pv-panel" role="dialog" aria-label="Preview settings">
          <p className="pv-title">Preview</p>
          <p className="pv-note">Try other times, weather, moons and music. This only changes your view; reload to go back to live.</p>
          {PREVIEW_CONTROLS.filter((c) => !c.when || c.when(state)).map((c) => (
            <div className="pv-field" key={c.key}>
              <span className="pv-label">{c.label}</span>
              {c.type === 'time' ? <TimeControl value={state.time} /> : null}
              {c.type === 'choice' ? <ChoiceControl control={c} value={state[c.key]} /> : null}
              {c.type === 'range' ? <RangeControl control={c} value={state[c.key]} /> : null}
            </div>
          ))}
          <button type="button" className="btn pv-reset" onClick={resetPreview} disabled={!isPreviewing()}>
            Back to live
          </button>
        </div>
      ) : null}
    </div>
  );
}
