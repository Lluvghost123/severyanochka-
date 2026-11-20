// Набор иконок (stroke, 24x24). Размер задаётся пропсом size.
const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const IconHeart = ({ size = 24, filled = false }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 8.6 5c1.3 0 2.6.7 3.4 1.9C12.8 5.7 14.1 5 15.4 5A4.6 4.6 0 0 1 20 9.5c0 6.1-8 11-8 11z" />
  </svg>
);

export const IconBox = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2L12 3z" />
    <path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" />
    <path d="m8 5.1 8 4.3" />
  </svg>
);

export const IconCart = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M3 4h2.4l2 10.2h10.2L19.6 7H6.2" />
    <circle cx="9" cy="19" r="1.2" />
    <circle cx="17" cy="19" r="1.2" />
  </svg>
);

export const IconSearch = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);

export const IconChevronDown = ({ size = 24 }) => (
  <svg {...base(size)}><path d="m6 9.5 6 6 6-6" /></svg>
);

export const IconChevronRight = ({ size = 24 }) => (
  <svg {...base(size)}><path d="m9.5 6 6 6-6 6" /></svg>
);

export const IconChevronLeft = ({ size = 24 }) => (
  <svg {...base(size)}><path d="m14.5 6-6 6 6 6" /></svg>
);

export const IconDoubleLeft = ({ size = 24 }) => (
  <svg {...base(size)}><path d="m12 6-6 6 6 6M18 6l-6 6 6 6" /></svg>
);

export const IconDoubleRight = ({ size = 24 }) => (
  <svg {...base(size)}><path d="m6 6 6 6-6 6M12 6l6 6-6 6" /></svg>
);

export const IconBurger = ({ size = 24 }) => (
  <svg {...base(size)} strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);

export const IconClose = ({ size = 24 }) => (
  <svg {...base(size)} strokeWidth="1.6"><path d="m5.5 5.5 13 13M18.5 5.5l-13 13" /></svg>
);

export const IconUser = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.6-3.6 3.3-5.5 7-5.5s6.4 1.9 7 5.5" />
  </svg>
);

export const IconShare = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="6" cy="12" r="2.4" />
    <circle cx="17.5" cy="6" r="2.4" />
    <circle cx="17.5" cy="18" r="2.4" />
    <path d="m8.2 10.8 7.1-3.6M8.2 13.2l7.1 3.6" />
  </svg>
);

export const IconBell = ({ size = 24, off = false }) => (
  <svg {...base(size)}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    {off && <path d="m4 4 16 16" />}
  </svg>
);

export const IconInfo = ({ size = 24 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.4" />
  </svg>
);

export const IconPhone = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M6.2 3.5h3l1.4 4-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z" />
  </svg>
);

export const IconTrash = ({ size = 24 }) => (
  <svg {...base(size)}>
    <path d="M5 7h14M10 4h4M7 7l.8 12.5h8.4L17 7M10.5 11v5M13.5 11v5" />
  </svg>
);

export const IconMenuLines = ({ size = 24 }) => (
  <svg {...base(size)}><path d="M5 8h14M5 12h14M5 16h14" /></svg>
);

export const IconLeaf = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#70C05B">
    <path d="M3 12a9 9 0 0 1 18 0z" />
  </svg>
);

export const IconStar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z" />
  </svg>
);

export const IconInstagram = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#FDC830" />
        <stop offset=".5" stopColor="#F2415C" />
        <stop offset="1" stopColor="#8A3AB9" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#ig)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2" />
    <circle cx="17.2" cy="6.8" r="1.2" fill="#F2415C" />
  </svg>
);

export const IconVk = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A7CFF">
    <path d="M12.8 17.3c-6.3 0-9.9-4.3-10-11.6h3.2c.1 5.3 2.4 7.5 4.3 8V5.7h3v4.6c1.9-.2 3.8-2.3 4.4-4.6h3c-.5 2.8-2.6 4.9-4.1 5.7 1.5.7 3.9 2.5 4.8 5.9h-3.3c-.7-2.2-2.4-3.9-4.8-4.1v4.1h-.5z" />
  </svg>
);

export const IconFacebook = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="3.5" fill="#1778F2" />
    <path d="M15.6 22v-7.6h2.5l.4-3h-2.9V9.5c0-.9.3-1.5 1.5-1.5h1.5V5.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H10v3h2.7V22z" fill="#fff" />
  </svg>
);

export const IconOk = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F7931E" strokeWidth="2.4" strokeLinecap="round">
    <circle cx="12" cy="7.2" r="3.6" />
    <path d="M7 12.5c3 2 7 2 10 0M12 14.5l-3.6 4.8M12 14.5l3.6 4.8" />
  </svg>
);
