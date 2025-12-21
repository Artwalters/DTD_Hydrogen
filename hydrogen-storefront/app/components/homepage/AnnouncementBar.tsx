import {useState} from 'react';

export interface AnnouncementBarProps {
  message?: string;
  languages?: string[];
  currentLanguage?: string;
}

export function AnnouncementBar({
  message = 'Free delivery on orders over €160',
  languages = ['EN', 'NL'],
  currentLanguage = 'EN',
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [language, setLanguage] = useState(currentLanguage);

  if (!isVisible) return null;

  return (
    <div className="dtd-announcement-bar">
      <span className="dtd-announcement-bar__message">{message}</span>

      <div className="dtd-announcement-bar__controls">
        <select
          className="dtd-announcement-bar__language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <button
          className="dtd-announcement-bar__language"
          aria-label="Currency"
        >
          EUR €
        </button>

        <button
          className="dtd-announcement-bar__close"
          onClick={() => setIsVisible(false)}
          aria-label="Close announcement"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
