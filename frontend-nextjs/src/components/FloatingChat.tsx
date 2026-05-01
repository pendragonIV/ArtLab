'use client';

import React, { useState } from 'react';
import styles from './FloatingChat.module.css';
import { MessageCircle, X, Megaphone, User, CreditCard, RefreshCcw, PlayCircle, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useLanguage();

  const toggleChat = () => setIsOpen(!isOpen);

  // Translations for chat UI
  const translations = {
    vi: {
      brand: 'ArtLab Support',
      announcement: 'Thời gian hỗ trợ: 9:00 - 18:00 (Thứ 2 - Thứ 6)',
      greetingTitle: 'Xin chào! 👋',
      greetingDesc: 'Chào mừng bạn đến với trung tâm hỗ trợ ArtLab. Bạn cần chúng tôi giúp đỡ về vấn đề gì hôm nay?',
      btnAccount: 'Tài khoản',
      btnPayment: 'Thanh toán',
      btnRefund: 'Hoàn tiền',
      btnPlayer: 'Trình phát video',
      btnCourses: 'Khóa học',
    },
    en: {
      brand: 'ArtLab Support',
      announcement: 'Business Hours: 9:00 - 18:00 (Mon - Fri)',
      greetingTitle: 'Hello! 👋',
      greetingDesc: 'Welcome to ArtLab support center. How can we help you today?',
      btnAccount: 'Account',
      btnPayment: 'Payment',
      btnRefund: 'Refunds',
      btnPlayer: 'Video Player',
      btnCourses: 'Courses',
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.en;

  const [messages, setMessages] = useState<{sender: 'user'|'bot', text: string}[]>([]);

  const handleQuickAction = (actionText: string) => {
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: actionText }]);
    
    // Simulate bot typing and replying
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: lang === 'vi' 
          ? `Cảm ơn bạn đã quan tâm đến mục "${actionText}". Đội ngũ hỗ trợ sẽ phản hồi trong giây lát...`
          : `Thanks for asking about "${actionText}". Our support team will be with you shortly...`
      }]);
    }, 600);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerBrand}>
            <div className={styles.brandLogo}>
              <MessageCircle size={16} />
            </div>
            <div className={styles.brandName}>{t.brand}</div>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', pointerEvents: 'auto' }} onClick={toggleChat}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.announcement}>
            <Megaphone size={16} color="#6366f1" />
            <span>{t.announcement}</span>
          </div>

          <div className={styles.greeting}>
            <div className={styles.botAvatar}>
              <MessageCircle size={18} />
            </div>
            <div className={styles.messageBubble}>
              <span className={styles.messageStrong}>{t.greetingTitle}</span>
              {t.greetingDesc}
            </div>
          </div>

          <div className={styles.quickActions}>
            <button className={styles.actionBtn} onClick={() => handleQuickAction(t.btnAccount)}><User size={16} /> {t.btnAccount}</button>
            <button className={styles.actionBtn} onClick={() => handleQuickAction(t.btnPayment)}><CreditCard size={16} /> {t.btnPayment}</button>
            <button className={styles.actionBtn} onClick={() => handleQuickAction(t.btnRefund)}><RefreshCcw size={16} /> {t.btnRefund}</button>
            <button className={styles.actionBtn} onClick={() => handleQuickAction(t.btnPlayer)}><PlayCircle size={16} /> {t.btnPlayer}</button>
            <button className={styles.actionBtn} onClick={() => handleQuickAction(t.btnCourses)}><BookOpen size={16} /> {t.btnCourses}</button>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={msg.sender === 'user' ? styles.userMessageRow : styles.greeting}>
              {msg.sender === 'bot' && (
                <div className={styles.botAvatar}>
                  <MessageCircle size={18} />
                </div>
              )}
              <div className={msg.sender === 'user' ? styles.userMessageBubble : styles.messageBubble}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.fab} onClick={toggleChat}>
        <div className={styles.fabIconWrap}>
          <MessageCircle size={28} className={`${styles.icon} ${isOpen ? styles.iconHidden : styles.iconVisible}`} />
          <X size={28} className={`${styles.icon} ${!isOpen ? styles.iconHidden : styles.iconVisible}`} />
        </div>
      </button>
    </div>
  );
}
