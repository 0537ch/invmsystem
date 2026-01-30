import { useState, useEffect, useRef, useCallback } from 'react';
import type { BannerItem } from '@/app/banner/_hooks/use-banner-setting';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, config: unknown) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeAPILoaded = false;
let youtubeAPILoading = false;
const youtubeAPICallbacks: Array<() => void> = [];

export const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (youtubeAPILoaded) {
      resolve();
      return;
    }

    youtubeAPICallbacks.push(resolve);

    if (youtubeAPILoading) return;

    youtubeAPILoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      youtubeAPILoaded = true;
      youtubeAPICallbacks.forEach((cb) => cb());
      youtubeAPICallbacks.length = 0;
    };
  });
};

export function useBannerDisplay() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchBannersRef = useRef<(() => Promise<void>) | null>(null);
  const isFetchingRef = useRef(false);

  const fetchBanners = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      if (response.ok) {
        const activeBanners = (data.banners || [])
          .filter((b: BannerItem) => b && b.active !== false)
          .filter((b: BannerItem) => b.id && b.type && b.url);

        setBanners(activeBanners);

        setCurrentIndex((prev) => {
          if (activeBanners.length === 0) return 0;
          if (prev >= activeBanners.length) return activeBanners.length - 1;
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchBannersRef.current = fetchBanners;
  }, [fetchBanners]);

  useEffect(() => {
    const eventSource = new EventSource('/api/banner/events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sync') {
          fetchBannersRef.current?.();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length === 0) return;

    const currentBanner = banners[currentIndex];

    if (!currentBanner || !currentBanner.type) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentBanner.type === 'youtube' || currentBanner.type === 'video') {
      return;
    }

    const duration = currentBanner.duration ?? 10;
    if (duration <= 0) return;

    timerRef.current = setTimeout(() => {
      goToNextSlide();
    }, duration * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, banners, goToNextSlide]);

  return {
    banners,
    loading,
    currentIndex,
    goToNextSlide,
  };
}
