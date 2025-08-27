
import React from 'react';
import { Icon } from './Icons';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange && onRatingChange(star)}
          className={`
            ${onRatingChange ? 'cursor-pointer' : 'cursor-default'}
            ${star <= rating ? 'text-amber-400' : 'text-stone-300'}
            transition-colors duration-200
          `}
        >
          <Icon name="star" className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};
