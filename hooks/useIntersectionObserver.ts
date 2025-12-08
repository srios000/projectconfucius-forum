import { useEffect, useRef, useState } from "react";

/**
 * Observes when a sentinel element enters the viewport to drive infinite lists.
 * @param options - IntersectionObserver options passed to the browser API.
 * @returns Ref to attach to the sentinel element and a flag for intersection state.
 */
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return { ref, isIntersecting };
};
