import { type ReactNode } from 'react';

type GroupToolbarIconProps = { name: 'add' | 'move' | 'expand' | 'collapse' | 'delete' };
export function GroupToolbarIcon({ name }: GroupToolbarIconProps) {
  const shapes: Record<GroupToolbarIconProps['name'], ReactNode> = {
    add: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 14h18M9 14v6M15 14v6M12 7v4M10 9h4" />
      </>
    ),
    move: <path d="M8 20V4m-4 4 4-4 4 4m4-4v16m-4-4 4 4 4-4" />,
    expand: <path d="m9 6 6 6-6 6" />,
    collapse: <path d="m6 9 6 6 6-6" />,
    delete: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
