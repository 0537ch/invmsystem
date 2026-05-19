import { useState, useEffect, useRef, useCallback } from 'react';
import type { BannerItem } from '@/types';

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

const getDeviceId = (): string => {
  const key = 'banner_device_id';
  let id = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!id) {
    id = crypto.randomUUID();
    if (typeof window !== 'undefined') localStorage.setItem(key, id);
  }
  return id;
};

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
  const [slides, setSlides] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchBannersRef = useRef<(() => Promise<void>) | null>(null);
  const isFetchingRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_DELAY = 30000;

  const expandBanners = (banners: BannerItem[]) => {
    const result: BannerItem[] = [];
    for (const banner of banners) {
      if (banner.type === 'event' && banner.eventEntries?.length) {
        for (const entry of banner.eventEntries) {
          result.push({ ...banner, url: entry.pictureUrl, eventEntryId: entry.id });
        }
      } else {
        result.push(banner);
      }
    }
    return result;
  };

  const fetchBanners = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      if (response.ok) {
        const activeBanners = (data.banners || [])
          .filter((b: BannerItem) => b && b.active !== false)
          .filter((b: BannerItem) => b.id && b.type && (b.url || b.type === 'event'));
        const expanded = expandBanners(activeBanners);
        setSlides(expanded);
        setCurrentIndex((prev) => {
          if (expanded.length === 0) return 0;
          return prev >= expanded.length ? expanded.length - 1 : prev;
        });
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setSlides([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const connectToSSE = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const eventSource = new EventSource(`/api/banner/events?deviceId=${getDeviceId()}`);
    eventSourceRef.current = eventSource;
    eventSource.onopen = () => { reconnectAttemptsRef.current = 0; };
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sync') fetchBannersRef.current?.();
      } catch { /* ignore */ }
    };
    eventSource.onerror = () => {
      eventSource.close();
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), MAX_RECONNECT_DELAY);
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(connectToSSE, delay);
    };
  }, []);

  useEffect(() => { fetchBannersRef.current = fetchBanners; }, [fetchBanners]);
  useEffect(() => {
    connectToSSE();
    return () => { eventSourceRef.current?.close(); clearTimeout(reconnectTimeoutRef.current || undefined); };
  }, [connectToSSE]);
  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (currentSlide.type === 'youtube' || currentSlide.type === 'video') return;
    const duration = currentSlide.duration ?? 10;
    if (duration <= 0) return;
    timerRef.current = setTimeout(goToNextSlide, duration * 1000);
    return () => { clearTimeout(timerRef.current || undefined); };
  }, [currentIndex, slides, goToNextSlide]);

  return { slides, loading, currentIndex, goToNextSlide };
}