import { useEffect, useRef, useState } from "react";

/**
 * A custom hook that utilizes the Intersection Observer API to detect when an element enters or leaves the viewport.
 * This is primarily used for implementing infinite scrolling by observing a sentinel element at the bottom of a list.
 * @param options - Configuration options for the IntersectionObserver instance.
 * @returns An object containing a ref to be attached to the target element and a boolean indicating if it is currently intersecting.
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
