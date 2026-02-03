"use client";

import { useBannerDisplay } from '../_hooks/use-banner-display';
import { YouTubePlayer } from './YouTubePlayer';

export const BannerDisplay = () => {
  const { banners, loading, currentIndex, goToNextSlide } = useBannerDisplay();

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

  if (!currentBanner || !currentBanner.id) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Slide Tracker */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-50 bg-black/70 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-mono text-xs sm:text-lg backdrop-blur-sm">
        {currentIndex + 1}/{banners.length}
      </div>

      {currentBanner && (currentBanner.title || currentBanner.description) && currentBanner.type !== 'youtube' && currentBanner.type !== 'video' && (
        <div className="absolute bottom-8 left-2 right-2 sm:bottom-4 sm:left-20 sm:right-auto z-50 max-w-lg">
          <div className="bg-linear-to-r from-black/80 via-black/60 to-transparent text-white p-2 sm:p-4 rounded-lg backdrop-blur-sm">
            {currentBanner.title && (
              <h2 className="text-base sm:text-xl font-bold mb-1">{currentBanner.title}</h2>
            )}
            {currentBanner.description && (
              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 sm:line-clamp-none">{currentBanner.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-0" key={currentBanner.id}>
        {currentBanner?.type === 'image' && currentBanner?.url && (
          <img
            src={currentBanner.url}
            alt={currentBanner.title || 'Banner'}
            className="w-full h-full object-contain"
          />
        )}

        {currentBanner?.type === 'youtube' && currentBanner?.url && (
          <YouTubePlayer
            videoId={currentBanner.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&/]+)/)?.[1] || ''}
            isPlaying={true}
            onEnd={goToNextSlide}
          />
        )}

        {currentBanner?.type === 'video' && currentBanner?.url && (
          <video
            src={currentBanner.url}
            autoPlay
            controls
            playsInline
            className="w-full h-full object-contain"
            onEnded={goToNextSlide}
          />
        )}

        {currentBanner?.type === 'gdrive' && currentBanner?.url && (
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

        {currentBanner?.type === 'iframe' && currentBanner?.url && (
          <iframe
            src={currentBanner.url}
            title={currentBanner.title || 'Content'}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        )}

        {/*
        {currentBanner?.type === 'pdf' && currentBanner?.url && (
          (() => {
            // Check if it's a Google Drive URL and convert it to preview format
            const fileIdMatch = currentBanner.url.match(/\/d\/([^/]+)/);
            const idMatch = currentBanner.url.match(/id=([^/&]+)/);
            const fileId = fileIdMatch?.[1] || idMatch?.[1];

            let pdfUrl: string;
            if (fileId) {
              // Google Drive PDF - use preview URL
              pdfUrl = `https://drive.google.com/file/d/${fileId}/preview?embedded=true`;
            } else {
              // Direct PDF URL - use as is
              pdfUrl = currentBanner.url;
            }

            return (
              <iframe
                src={pdfUrl}
                title={currentBanner.title || 'PDF'}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
              />
            );
          })()
        )}
        */}
      </div>
    </div>
  );
};
