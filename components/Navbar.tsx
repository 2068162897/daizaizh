"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
// 🌟 引入控制中心配置
import { siteConfig } from '../siteConfig';

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // 这里的逻辑保持不变：下滑隐藏，上滑显示
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: '首页', href: '/' },
    { name: '项目', href: '/projects' },
    { name: '归档', href: '/timeline' },
    { name: '照片墙', href: '/photowall' },
    // 🌟 仅仅在这里增加音乐跳转
    { name: '音乐', href: '/music' },
    { name: '说说', href: '/moments' },
    { name: '杂谈', href: '/chatter' },
    { name: '友链', href: '/friends' },
    { name: '关于', href: '/about' },
  ];

  return (
    <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}>
      <div className="w-[90%] max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-[30px] box-border">

        {/* 🌟 核心修改：动态读取 siteConfig.authorName */}
        <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300">
          {siteConfig.authorName} <span className="text-indigo-500">の</span> 宝藏之地
        </Link>

        <nav className="hidden md:flex gap-8 text-sm font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname === `${link.href}/`;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}