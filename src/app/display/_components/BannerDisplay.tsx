"use client";

import { useBannerDisplay } from '../_hooks/use-banner-display';
import { YouTubePlayer } from './YouTubePlayer';
import { EventBannerDisplay } from './EventBannerDisplay';

export const BannerDisplay = () => {
  const { slides, loading, currentIndex, goToNextSlide } = useBannerDisplay();

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        No Content
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  if (!currentSlide) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-50 bg-black/70 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-mono text-xs sm:text-lg backdrop-blur-sm">
        {currentIndex + 1}/{slides.length}
      </div>

      {currentSlide && (currentSlide.title || currentSlide.description) && currentSlide.type !== 'youtube' && currentSlide.type !== 'video' && (
        <div className="absolute bottom-8 left-2 right-2 sm:bottom-4 sm:left-20 sm:right-auto z-50 max-w-lg">
          <div className="bg-linear-to-r from-black/80 via-black/60 to-transparent text-white p-2 sm:p-4 rounded-lg backdrop-blur-sm">
            {currentSlide.title && (
              <h2 className="text-base sm:text-xl font-bold mb-1">{currentSlide.title}</h2>
            )}
            {currentSlide.description && (
              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 sm:line-clamp-none">{currentSlide.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-0" key={currentSlide.id}>
        {currentSlide?.type === 'image' && currentSlide?.url && (
          <img src={currentSlide.url} alt={currentSlide.title || 'Banner'} className="w-full h-full object-contain" />
        )}

        {currentSlide?.type === 'youtube' && currentSlide?.url && (
          <YouTubePlayer
            videoId={currentSlide.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&/]+)/)?.[1] || ''}
            isPlaying={true}
            onEnd={goToNextSlide}
          />
        )}

        {currentSlide?.type === 'video' && currentSlide?.url && (
          <video
            src={currentSlide.url}
            autoPlay
            muted
            controls
            playsInline
            className="w-full h-full object-contain"
            onEnded={goToNextSlide}
          />
        )}

        {currentSlide?.type === 'gdrive' && currentSlide?.url && (
          (() => {
            const fileId = currentSlide.url.match(/\/d\/([^/]+)/)?.[1];
            if (!fileId) return <div className="text-white flex items-center justify-center h-full">Invalid Drive URL</div>;
            const directImageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w3840`;
            return (
              <img
                src={directImageUrl}
                alt={currentSlide.title || 'Google Drive Image'}
                className="w-full h-full object-contain bg-black"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<div class="text-red-500 flex items-center justify-center h-full">Image Load Failed. Check Permissions.</div>`;
                }}
              />
            );
          })()
        )}

        {currentSlide?.type === 'iframe' && currentSlide?.url && (
          <iframe
            src={currentSlide.url}
            title={currentSlide.title || 'Content'}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        )}

        {currentSlide?.type === 'event' && currentSlide.eventEntries && currentSlide.eventEntries.length > 0 && (
          <EventBannerDisplay
            entries={currentSlide.eventEntries}
            currentIndex={currentSlide.eventEntries.findIndex(e => e.id === currentSlide.eventEntryId)}
          />
        )}
      </div>
    </div>
  );
};
