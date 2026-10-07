import { useEffect, useState } from 'react';

interface TypewriterResult {
  displayed: string;
  done: boolean;
}

/**
 * Reveals `text` one character at a time.
 *
 * @param text        Full string to type out.
 * @param speed       Milliseconds between each revealed character.
 * @param startDelay  Milliseconds to wait before typing begins.
 */
export function useTypewriter(
  text: string,
  speed = 38,
  startDelay = 600
): TypewriterResult {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let charIndex = 0;
    let intervalId: number | undefined;

    const startTimeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        charIndex += 1;
        setDisplayed(text.slice(0, charIndex));

        if (charIndex >= text.length) {
          if (intervalId !== undefined) {
            window.clearInterval(intervalId);
          }
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
