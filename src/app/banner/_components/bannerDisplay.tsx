"use client";
import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { BannerItem } from './bannerSetting';

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

const loadYouTubeAPI = (): Promise<void> => {
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

// YouTube Player Component
interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onEnd: () => void;
}

const YouTubePlayerComponent: React.FC<YouTubePlayerProps> = ({ videoId, isPlaying, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isReadyRef = useRef(false);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!containerRef.current) return;

    let player: YouTubePlayer | null = null;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (!window.YT || !containerRef.current) return;

      player = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            isReadyRef.current = true;
            if (player && isPlaying) {
              player.playVideo();
            }
          },
          onStateChange: (event: unknown) => {
            const state = (event as { data: number }).data;
            if (state === 0) { // ENDED
              onEndRef.current();
            }
          },
        },
      });

      playerRef.current = player;
    };

    initPlayer();

    return () => {
      isReadyRef.current = false;
      if (player) {
        try {
          player.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, [videoId]);

  // Control playback based on isPlaying prop
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

// Main Banner Display Component
const BannerDisplay = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banner');
        const data = await response.json();
        if (response.ok) {
          setBanners(data.banners);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

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

    // For YouTube videos, let the onEnd callback handle timing
    if (currentBanner.type === 'youtube') {
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

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        No Content
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Only render the current slide */}
      <div className="absolute inset-0" key={currentBanner.id}>
        {currentBanner.type === 'image' && (
          <img
            src={currentBanner.url}
            alt={currentBanner.title || 'Banner'}
            className="w-full h-full object-contain"
          />
        )}

        {currentBanner.type === 'youtube' && (
          <YouTubePlayerComponent
            videoId={currentBanner.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&/]+)/)?.[1] || ''}
            isPlaying={true}
            onEnd={goToNextSlide}
          />
        )}

        {currentBanner.type === 'gdrive' && (
          (() => {
            const fileId = currentBanner.url.match(/\/d\/([^/]+)/)?.[1];
            if (!fileId) return <div className="text-white flex items-center justify-center h-full">Invalid Drive URL</div>;
            const directImageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w3840`;

            return (
              <img
                src={directImageUrl}
                alt={currentBanner.title || 'Google Drive Image'}
                className="w-full h-full object-contain bg-black"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<div class="text-red-500 flex items-center justify-center h-full">Image Load Failed. Check Permissions.</div>`;
                }}
              />
            );
          })()
        )}

        {currentBanner.type === 'iframe' && (
          <iframe
            src={currentBanner.url}
            title={currentBanner.title || 'Content'}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        )}
      </div>
    </div>
  );
};

export default BannerDisplay;
