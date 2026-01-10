/**
 * Scroll to Top Button Component
 * Shows when user scrolls down, hides when at top
 */

import { ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ScrollToTopProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function ScrollToTop({ scrollContainerRef }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsVisible(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all duration-200 hover:scale-110 z-50"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp size={24} />
    </button>
  );
}
