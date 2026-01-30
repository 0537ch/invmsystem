"use client";

import React, { useRef, useEffect } from 'react';
import { loadYouTubeAPI } from '../_hooks/use-banner-display';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onEnd: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isPlaying, onEnd }) => {
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
