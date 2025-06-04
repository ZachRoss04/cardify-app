import React from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import { Deck, Card as CardItem } from '../../types';

interface DeckDetailsProps {
  deck: Deck;
  cards: CardItem[];
}

const DeckDetails: React.FC<DeckDetailsProps> = ({ deck, cards }) => {
  // Format the creation date
  const formattedDate = new Date(deck.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{deck.title}</h1>
        <div className="flex items-center text-gray-500 text-sm">
          <span>{cards.length} cards</span>
          <span className="mx-2">•</span>
          <span>Created on {formattedDate}</span>
        </div>
      </div>

      {/* Removed button section */}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Cards</h2>
        
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="bg-gray-50">
              <div className="font-medium">{card.front}</div>
            </CardHeader>
            <CardContent>
              <div className="text-blue-600 font-medium">{card.back}</div>
              <div className="mt-2 text-xs text-gray-500">
                {card.sourcePage ? `Page ${card.sourcePage}` : 'No page'} • {card.contextSnippet}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeckDetails;