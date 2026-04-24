import { Star } from "lucide-react";

export default function StarRating({ rating = 0, onRate, size = 16, interactive = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`transition-colors ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
          onClick={() => interactive && onRate?.(star)}
        />
      ))}
    </div>
  );
}
