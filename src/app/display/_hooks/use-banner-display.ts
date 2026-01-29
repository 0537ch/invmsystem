import { useState, useEffect, useRef, useCallback } from 'react';
import type { BannerItem } from '@/app/banner/_hooks/use-banner-setting';

// YouTube API type definitions
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

// YouTube API loader - singleton pattern
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

  // Fetch banners function
  const fetchBanners = useCallback(async () => {
    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      if (response.ok) {
        // Only show active banners
        const activeBanners = data.banners.filter((b: BannerItem) => b.active !== false);
        setBanners(activeBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep ref updated
  useEffect(() => {
    fetchBannersRef.current = fetchBanners;
  }, [fetchBanners]);

  // Setup SSE connection (only once)
  useEffect(() => {
    console.log('Setting up SSE connection...');
    const eventSource = new EventSource('/api/banner/events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);
        if (data.type === 'sync') {
          console.log('Sync received, refreshing banners...');
          // Use ref to always get latest fetchBanners function
          fetchBannersRef.current?.();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // EventSource will automatically reconnect
    };

    return () => {
      console.log('Closing SSE connection...');
      eventSource.close();
    };
  }, []); // Empty deps = only runs once

  // Initial fetch
  useEffect(() => {
    console.log('Initial fetch of banners...');
    fetchBanners();
  }, [fetchBanners]);

  // Go to next slide
  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Handle timing for current slide
  useEffect(() => {
    if (banners.length === 0) return;

    const currentBanner = banners[currentIndex];

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // For YouTube and video files, let the onEnd callback handle timing
    if (currentBanner.type === 'youtube' || currentBanner.type === 'video') {
      return;
    }

    // For other types, use duration
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
