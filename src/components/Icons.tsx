type P = { className?: string };

const base = (className = "size-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const PlayIcon = ({ className = "size-5" }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
  </svg>
);
export const PauseIcon = ({ className = "size-5" }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
export const NextIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m5 4 10 8-10 8V4Z" fill="currentColor" />
    <path d="M19 5v14" />
  </svg>
);
export const PrevIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m19 20-10-8 10-8v16Z" fill="currentColor" />
    <path d="M5 19V5" />
  </svg>
);
export const DownloadIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const FolderIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </svg>
);
export const LinkIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
  </svg>
);
export const TrashIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);
export const GripIcon = ({ className }: P) => (
  <svg className={className ?? "size-4"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.5" />
        <circle cx="15" cy={y} r="1.5" />
      </g>
    ))}
  </svg>
);
export const UploadIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 16V4m0 0-4 4m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const ArrowLeftIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
);
export const ExternalIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);
