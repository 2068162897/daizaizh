"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { MapPin, MessageSquare, Clock, Sparkles, Search, ArrowDownAZ, ArrowUpZA, ChevronLeft, ChevronRight, Ghost } from 'lucide-react';
import MomentComments from '../../components/MomentComments';

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function MomentList({ moments, authorName, avatarUrl }: any) {
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null);

  const processedMoments = useMemo(() => {
    let result = moments ? [...moments] : [];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        (m.content || '').toLowerCase().includes(query) ||
        (m.location || '').toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [moments, searchQuery, sortOrder]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length });
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length });
  };

  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;
    const count = images.length;

    if (count === 1) {
      return (
        <div className="mt-8 flex justify-center w-full">
          <div onClick={() => setLightbox({ images, index: 0 })} className="max-w-[280px] overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-xl cursor-zoom-in group">
            <img src={images[0]} alt="moment" className="w-full h-auto max-h-[400px] object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      );
    }

    const columns = count === 4 ? 2 : 3;
    const maxWidth = count === 4 ? '210px' : '320px';

    return (
      <div className="w-full flex justify-center mt-8">
        <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, width: '100%', maxWidth: maxWidth }}>
          {images.slice(0, 9).map((src, idx) => {
            const isLastVisible = idx === 8 && count > 9;
            return (
              <div key={idx} onClick={() => setLightbox({ images, index: idx })} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200/20 dark:bg-slate-700/20 border border-slate-200/50 dark:border-white/10 cursor-zoom-in">
                <img src={src} alt="moment" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {isLastVisible && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-[2px]">
                    <span className="text-xl font-black">+{count - 9}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMomentCard = (moment: any) => (
    <motion.div
      key={moment.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      className="flex flex-col bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-xl border border-white/40 dark:border-white/10 p-8 md:p-10 transition-shadow hover:shadow-2xl overflow-hidden relative group w-full"
    >
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50 relative">
        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-700">
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-[#576b95] dark:text-[#7f99cc] tracking-wide">{authorName}</h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-1"><Clock size={12} /> {timeAgo(moment.date)}</div>
        </div>
      </div>
      <p className="text-slate-800 dark:text-slate-200 text-[16px] leading-relaxed whitespace-pre-wrap font-medium break-words">{moment.content}</p>

      {renderImages(moment.images)}

      <div className="mt-10 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {moment.location && <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 max-w-full truncate border border-indigo-500/10"><MapPin size={12} /> {moment.location}</span>}
        </div>
        <button onClick={() => setOpenCommentId(openCommentId === moment.id ? null : moment.id)} className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-all shadow-sm ${openCommentId === moment.id ? 'bg-indigo-500 text-white shadow-indigo-500/30 rotate-12' : 'bg-white/80 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <MessageSquare size={16} />
        </button>
      </div>

      <AnimatePresence>
        {openCommentId === moment.id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 24 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 relative shadow-inner">
              <div className="absolute -top-2 right-8 w-4 h-4 bg-slate-50/50 dark:bg-slate-900/50 rotate-45 border-l border-t border-slate-200/50"></div>
              <MomentComments id={`/moments/${moment.id}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="w-[90%] max-w-6xl mx-auto py-10 mt-28 relative z-10 flex-1 flex flex-col min-h-[85vh]">

      <div className="mb-14 text-center relative">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">生活动态</motion.h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-500" /> “ 在代码之外捕捉瞬间的温度 ”
        </p>
      </div>

      <div className="mb-16 flex flex-col items-center gap-8">
        <div className="relative w-full max-w-lg group">
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20 pointer-events-none" />
          <input type="text" placeholder="搜寻被遗忘的记忆..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium relative z-10" />
        </div>

        <div className="flex bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm relative z-10">
          <button onClick={() => setSortOrder('desc')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${sortOrder === 'desc' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowDownAZ size={14} /> 最新
          </button>
          <button onClick={() => setSortOrder('asc')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${sortOrder === 'asc' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowUpZA size={14} /> 最早
          </button>
        </div>
      </div>

      <LayoutGroup>
        {processedMoments.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-8 pb-32 w-full items-start">
            <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
              <AnimatePresence mode='popLayout'>
                {processedMoments.filter((_, i) => i % 2 === 0).map(moment => renderMomentCard(moment))}
              </AnimatePresence>
            </div>
            <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
              <AnimatePresence mode='popLayout'>
                {processedMoments.filter((_, i) => i % 2 === 1).map(moment => renderMomentCard(moment))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 min-h-[450px]">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center px-10 py-20 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[50px] border border-white/30 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] max-w-lg w-full mx-auto">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                <Ghost size={48} className="text-indigo-500 relative z-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{searchQuery ? "没找到相关记忆" : "朋友圈空空如也"}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed px-4">{searchQuery ? `尝试精简你的搜索词，或者换个心情再次出发。` : `还没有记录下任何生活碎片呢。`}</p>
            </motion.div>
          </div>
        )}
      </LayoutGroup>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setLightbox(null)}
          >
            {lightbox.images.length > 1 && (
              <>
                <button className="absolute left-6 md:left-12 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={prevImg}><ChevronLeft size={36} /></button>
                <button className="absolute right-6 md:right-12 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={nextImg}><ChevronRight size={36} /></button>
              </>
            )}
            <motion.div key={lightbox.index} initial={{ opacity: 0, scale: 0.9, x: 50 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -50 }} className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 pointer-events-none">
              <img src={lightbox.images[lightbox.index]} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10" alt="fullscreen" />
              <div className="absolute bottom-10 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md text-white/70 text-xs font-black tracking-widest border border-white/10">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}