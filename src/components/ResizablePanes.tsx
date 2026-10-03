import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const HANDLE_WIDTH = 12;
const DEFAULT_RATIO = 1.3 / 2.3;
export function paneLimits(width: number) {
  const available = Math.max(0, width - HANDLE_WIDTH);
  return {
    available,
    min: Math.min(300, available / 2),
    max: available - Math.min(260, available / 2),
  };
}

export function ResizablePanes({ editor, preview }: { editor: ReactNode; preview: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [dragging, setDragging] = useState(false);
  useLayoutEffect(() => {
    const element = container.current!;
    const measure = () => {
      if (element.clientWidth) setWidth(element.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const { available, min, max } = paneLimits(width);
  const left = Math.max(min, Math.min(max, available * ratio));
  function resize(value: number) {
    if (available) setRatio(Math.max(min, Math.min(max, value)) / available);
  }
  return (
    <div
      ref={container}
      className={`resizable-panes ${dragging ? 'resizing' : ''}`}
      style={{
        gridTemplateColumns: width ? `${left}px ${HANDLE_WIDTH}px minmax(0, 1fr)` : undefined,
      }}
    >
      {editor}
      <div
        className="pane-divider"
        role="separator"
        aria-label="Resize editor and output"
        aria-orientation="vertical"
        aria-valuemin={Math.round(min)}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(left)}
        aria-valuetext={`Editor width ${Math.round(left)} pixels`}
        tabIndex={0}
        title="Drag to resize · Arrow keys to adjust · Double-click to reset"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            resize(
              event.clientX - container.current!.getBoundingClientRect().left - HANDLE_WIDTH / 2,
            );
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        onDoubleClick={() => setRatio(DEFAULT_RATIO)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 40 : 10;
          if (event.key === 'ArrowLeft') resize(left - step);
          else if (event.key === 'ArrowRight') resize(left + step);
          else if (event.key === 'Home') resize(min);
          else if (event.key === 'End') resize(max);
          else return;
          event.preventDefault();
        }}
      />
      {preview}
    </div>
  );
}
