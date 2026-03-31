'use client';
// components/Header.tsx
import { LogOut, Package2, Bell } from 'lucide-react';
import { APP_TITLE, APP_TAGLINE, LOGO_URL, THEME_COLOR, USER_NAME } from '@/config/settings.config';
import Image from 'next/image';

interface Props {
  userName: string;
  onLogout: () => void;
}

export default function Header({ userName, onLogout }: Props) {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-1 z-40 w-full">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm mt-2">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: `${THEME_COLOR}18` }}
            >
              {LOGO_URL && LOGO_URL !== '/logo.svg' ? (
                <Image src={LOGO_URL} alt="Logo" width={28} height={28} className="object-contain" />
              ) : (
                <Package2 size={18} style={{ color: THEME_COLOR }} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold text-slate-900 leading-none truncate">
                {APP_TITLE}
              </h1>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">{APP_TAGLINE}</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors relative">
              <Bell size={17} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: THEME_COLOR }}
              />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: THEME_COLOR }}
              >
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block truncate max-w-[100px]">
                {USER_NAME || userName}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
