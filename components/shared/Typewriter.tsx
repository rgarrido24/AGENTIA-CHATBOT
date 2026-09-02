'use client';

import { useEffect, useState } from 'react';

export default function Typewriter({
  words,
  typingSpeed = 55,
  deletingSpeed = 30,
  pauseMs = 1400,
  color = '#00D4FF',
}: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  color?: string;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (deleting && text === '') {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
      return;
    }

    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        );
      },
      deleting ? deletingSpeed : typingSpeed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, wordIndex, words, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span
      className="font-[family-name:var(--font-space)] font-semibold"
      style={{ color }}
    >
      {text}
      <span aria-hidden="true" className="opacity-60">
        |
      </span>
    </span>
  );
}
