import React from 'react';
import { Clock, Copy, Eye, Star, Trash2, BookOpen, Zap } from 'lucide-react'; // Added Star, Zap for Frenzy
import { CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { Deck } from '../../types';

interface DeckCardProps {
  deck: Deck;
  onPreview: (deckId: string) => void;
  onStudy: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  onToggleFavorite: (deckId: string, newStatus: boolean) => void; // Added for favoriting
  onPlayFrenzy: (deckId: string) => void; // Added for Flashcard Frenzy game
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, onPreview, onStudy, onDelete, onToggleFavorite, onPlayFrenzy }) => { // Added onToggleFavorite, onPlayFrenzy props
  // Local state to manage optimistic update of star, if desired, or just rely on parent re-render
  // For simplicity, we'll rely on parent re-render for now.
  // Format the creation date
  let formattedDate = 'Date N/A'; // Default if date is invalid
  if (deck.created_at && !isNaN(new Date(deck.created_at).getTime())) {
    formattedDate = new Date(deck.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Generate a topic-appropriate gradient based on the title
  const getGradient = (title: string) => {
    if (title.toLowerCase().includes('psychology')) {
      return 'from-purple-50 to-purple-100 border-purple-200';
    } else if (title.toLowerCase().includes('biology') || title.toLowerCase().includes('science')) {
      return 'from-green-50 to-green-100 border-green-200';
    } else if (title.toLowerCase().includes('history')) {
      return 'from-amber-50 to-amber-100 border-amber-200';
    } else if (title.toLowerCase().includes('math')) {
      return 'from-blue-50 to-blue-100 border-blue-200';
    } else if (title.toLowerCase().includes('language') || title.toLowerCase().includes('english')) {
      return 'from-red-50 to-red-100 border-red-200';
    } else {
      return 'from-indigo-50 to-indigo-100 border-indigo-200';
    }
  };

  return (
    <div 
      className={`h-full card-hover-effect border rounded-xl overflow-hidden ${getGradient(deck.title)}`}
    >
      <CardContent className="p-5 relative">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click if star is inside a clickable card area
            onToggleFavorite(deck.id, !deck.is_favorited);
          }}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 transition-colors z-10"
          aria-label={deck.is_favorited ? 'Unfavorite this deck' : 'Favorite this deck'}
          title={deck.is_favorited ? 'Unfavorite' : 'Favorite'}
        >
          <Star 
            size={20} 
            className={deck.is_favorited ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400 hover:text-yellow-500'}
          />
        </button>

        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-3">
          {deck.title}
        </h3>

        <div className="flex items-center mt-2 text-gray-600 text-sm bg-white/50 p-2 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Copy size={16} className="mr-1.5 text-indigo-500" />
            <span>{deck.card_count} cards</span>
          </div>
          <span className="mx-2 text-gray-300">•</span>
          <div className="flex items-center">
            <Clock size={16} className="mr-1.5 text-indigo-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

      </CardContent>

      <CardFooter className="p-4 flex justify-between bg-white border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          icon={<Eye size={16} />}
          onClick={() => onPreview(deck.id)}
          className="transition-all hover:bg-indigo-50 hover:border-indigo-200"
        >
          Preview
        </Button>
        <Button
          variant="outline" // Changed to outline to match Preview, primary might be too strong here
          size="sm"
          icon={<BookOpen size={16} />}
          onClick={() => onStudy(deck.id)}
          className="transition-all hover:bg-blue-50 hover:border-blue-200 text-blue-600 hover:text-blue-700"
        >
          Study
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Zap size={16} />}
          onClick={() => onPlayFrenzy(deck.id)}
          className="transition-all hover:bg-green-50 hover:border-green-300 text-green-600 hover:text-green-700"
        >
          Frenzy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={16} className="text-red-500" />}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click or other parent events
            if (window.confirm(`Are you sure you want to delete the deck "${deck.title}"? This action cannot be undone.`)) {
              onDelete(deck.id);
            }
          }}
          className="transition-all hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700"
          aria-label="Delete deck"
        >
          <></>
        </Button>
      </CardFooter>
    </div>
  );
};

export default DeckCard;