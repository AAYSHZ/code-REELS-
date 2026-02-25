import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

export default function DecryptedText({ text, className = '', speed = 50 }: DecryptedTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const intervals: NodeJS.Timeout[] = [];

    const decrypt = () => {
      if (i >= text.length) {
        setDone(true);
        return;
      }

      let scrambleCount = 0;
      const scrambleInterval = setInterval(() => {
        setDisplayed(
          text.slice(0, i) +
          CHARS[Math.floor(Math.random() * CHARS.length)] +
          Array.from({ length: text.length - i - 1 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
        );
        scrambleCount++;
        if (scrambleCount >= 3) {
          clearInterval(scrambleInterval);
          i++;
          setDisplayed(text.slice(0, i) + (i < text.length ? Array.from({ length: text.length - i }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('') : ''));
          decrypt();
        }
      }, speed);
      intervals.push(scrambleInterval);
    };

    setDisplayed(Array.from({ length: text.length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));
    setTimeout(decrypt, 300);

    return () => intervals.forEach(clearInterval);
  }, [text, speed]);

  return (
    <motion.span
      className={`font-mono ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {done ? text : displayed}
    </motion.span>
  );
}
