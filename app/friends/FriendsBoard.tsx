"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { friendsData } from '../../data/friends';
import Comments from '../../components/Comments'; // 🌟 引入你的 Gitalk 组件

// Framer Motion 动画变体：交错子元素
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 } // 每张卡片延迟 0.15 秒出现
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function FriendsBoard() {
  // 🌟 控制复制按钮的状态
  const [isCopied, setIsCopied] = useState(false);

  // 预设的申请格式
  const applyFormat = `名称：XingHuiSamaの宝藏之地\n简介：今天我也要学习吗\n链接：https://www.xinghuisama.top\n头像：https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg`;

  const handleCopy = () => {
    navigator.clipboard.writeText(applyFormat);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    // 🌟 加了 scroll-smooth 让锚点跳转时像德芙一样丝滑
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-10 py-10 relative z-10 scroll-smooth">

      {/* 顶部导航与标题 */}
      <div className="mb-12 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6">
          <BackButton />
        </div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest drop-shadow-sm uppercase">
            云端引力
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif">
            那些散落在赛博宇宙各处的有趣灵魂与神经节点。
          </p>
        </div>
      </div>

      {/* 友链卡片网格 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {friendsData.map((friend) => (
          <motion.div key={friend.id} variants={itemVariants}>
            <a
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group relative p-6"
            >
              {/* 卡片底部的动态光晕 */}
              <div
                className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ backgroundColor: friend.themeColor }}
              ></div>

              <div className="flex items-center gap-5 relative z-10 mb-4">
                {/* 旋转头像 */}
                <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-indigo-500/50 to-purple-500/50 shadow-md group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out flex-shrink-0">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover bg-white" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {friend.name}
                  </h2>
                  <div className="text-xs font-bold text-indigo-500/70 dark:text-indigo-400/70 tracking-widest uppercase mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Online
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3 relative z-10">
                {friend.description}
              </p>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* 🌟 新增：申请友链引导区 (带进场动画) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-20 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 max-w-3xl mx-auto text-center shadow-xl relative"
      >
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-wider">
          ✨ 建立神经连接
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-serif mb-6">
          欢迎各位大佬交换友链！请一键复制下方格式，并在底部的 Gitalk 留言板申请：
        </p>

        {/* 代码展示框 & 一键复制按钮 */}
        <div className="relative bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl p-5 text-left inline-block w-full max-w-md border border-slate-200/50 dark:border-slate-700/50 group">
          <pre className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {applyFormat}
          </pre>

          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition-all duration-300 shadow-sm backdrop-blur-sm"
            title="一键复制"
          >
            {isCopied ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500 hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-8">
          <a
            href="#gitalk-container"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
          >
            前往留言区申请 👇
          </a>
        </div>
      </motion.div>

      {/* 🌟 新增：Gitalk 评论区 */}
      {/* scroll-mt-24 确保锚点跳转时不会被顶部的 Navbar 挡住 */}
      <motion.div
        id="gitalk-container"
        className="mt-16 scroll-mt-24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-12 h-[1px] bg-slate-300 dark:bg-slate-700"></span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-gray-200 tracking-widest uppercase">
            终端留言板
          </h3>
          <span className="w-12 h-[1px] bg-slate-300 dark:bg-slate-700"></span>
        </div>

        {/* 渲染评论组件 */}
        <Comments />
      </motion.div>

    </div>
  );
}