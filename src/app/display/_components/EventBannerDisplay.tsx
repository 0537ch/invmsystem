import type { BannerEventEntry } from '@/types';

interface EventBannerDisplayProps {
  entries: BannerEventEntry[];
  currentIndex: number;
}

export const EventBannerDisplay = ({ entries, currentIndex }: EventBannerDisplayProps) => (
  <div className="flex w-full h-full">
    <div className="w-1/2 h-full overflow-y-auto bg-black/50 p-6">
      <ul className="space-y-3 flex flex-col items-center justify-center h-full">
        {entries.map((entry) => (
          <li key={entry.id} className="text-white text-2xl font-medium">
            {entry.name}
          </li>
        ))}
      </ul>
    </div>
    <div className="w-1/2 h-full">
      {entries[currentIndex]?.pictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entries[currentIndex].pictureUrl}
          alt="event"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">No Image</span>
        </div>
      )}
    </div>
  </div>
);