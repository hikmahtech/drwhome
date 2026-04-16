export function AdSlot({ slot }: { slot: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") {
    return (
      <div
        aria-label="ad placeholder"
        data-testid={`ad-slot-${slot}`}
        className="border border-dashed my-6 h-[100px] sm:h-[90px] flex items-center justify-center text-xs text-muted"
      >
        ad slot · {slot}
      </div>
    );
  }
  return <div data-ad-slot={slot} className="my-6" />;
}
