import React, { useState, useRef, useEffect } from 'react';
import { File, Link, Type, X, Pencil, RefreshCw, Download, Check, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Tabs from '../ui/Tabs';
import Slider from '../ui/Slider';
import Toggle from '../ui/Toggle';
import TagInput from '../ui/TagInput';
// Removed unused Card import
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { createDeck } from '../../lib/utils';
import { Card, AppState, AppStateAction, NewDeck } from '../../types';
import { CardsOnTheSpotAPI } from '../../lib/api';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeckModal: React.FC<DeckModalProps> = ({ isOpen, onClose }) => {
  let state: AppState;
  let dispatch: React.Dispatch<AppStateAction>;

  const appContextValue = useContext(AppContext);

  if (!appContextValue) {
    console.error('AppContext not available in DeckModal-bak. Using fallback state and dispatch.');
    // Fallback state matching AppState structure
    state = {
      user: null,
      newDeck: {
        title: '',
        sourceType: 'text',
        sourceValue: null,
        cardCount: 10, // Default card count
        clozeStyle: 'single',
        instruction: '',
        mustIncludeTerms: [],
      },
      previewCards: [],
      loading: false,
      error: null,
    };
    dispatch = () => { /* no-op */ };
  } else {
    state = appContextValue.state;
    dispatch = appContextValue.dispatch;
  }
  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'url'>('text');
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ front: '', back: '' });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track generation progress feedback - moved up to fix hooks order
  const [generationProgress, setGenerationProgress] = useState('');
  const [progressStage, setProgressStage] = useState(0);
  
  // Animated progress stages for better UX
  const progressStages = [
    'Analyzing content...',
    'Identifying key concepts...',
    'Generating cloze cards...',
    'Refining cards...',
    'Finalizing flashcards...'
  ];

  // Use effect to simulate progress through stages
  useEffect(() => {
    if (state.loading && progressStage < progressStages.length - 1) {
      const timer = setTimeout(() => {
        setProgressStage(prev => prev + 1);
        setGenerationProgress(progressStages[progressStage + 1]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.loading, progressStage, progressStages]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'pdf', label: 'PDF', icon: <File size={18} /> },
    { id: 'url', label: 'URL', icon: <Link size={18} /> },
    { id: 'text', label: 'Text', icon: <Type size={18} /> },
  ];

  const handleTabChange = (tabId: string) => {
    // Ensure we only set valid tab types
    const validTabId = (tabId === 'text' || tabId === 'pdf' || tabId === 'url') ? tabId : 'text';
    setActiveTab(validTabId);
    
    // Reset file state when switching tabs
    setSelectedFileName(null);
    
    dispatch({ 
      type: 'UPDATE_NEW_DECK', 
      payload: { sourceType: validTabId, sourceValue: null } 
    });
    
    // Reset any previous errors when switching tabs
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const handleSourceValueChange = (value: string | File) => {
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { sourceValue: value }
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_NEW_DECK', payload: { title: e.target.value } });
  };

  const handleCardCountChange = (value: number) => {
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { cardCount: value }
    });
  };

  const handleClozeStyleChange = (value: string) => {
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { clozeStyle: value as 'single' | 'multi' }
    });
  };

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { instruction: e.target.value }
    });
  };

  const handleMustIncludeTermsChange = (terms: string[]) => {
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { mustIncludeTerms: terms }
    });
  };

  // Progress stages already moved to the top of the component

  const handleGeneratePreview = async () => {
    // Validate inputs
    if (state.newDeck.sourceValue === null || 
        (typeof state.newDeck.sourceValue === 'string' && state.newDeck.sourceValue.trim() === '')) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Please provide source content to generate flashcards.' 
      });
      return;
    }

    // Reset progress indicators
    setProgressStage(0);
    setGenerationProgress(progressStages[0]);
    
    // Set loading state
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('[MODAL] Starting card generation with state:', {
        title: state.newDeck.title,
        sourceType: state.newDeck.sourceType,
        cardCount: state.newDeck.cardCount,
        clozeStyle: state.newDeck.clozeStyle,
        hasContent: !!state.newDeck.sourceValue
      });
      
      // Use CardsOnTheSpotAPI directly - this is what worked in the test page
      const result = await CardsOnTheSpotAPI.generateDeck(state.newDeck);
      console.log('[MODAL] Generation result:', result);
      
      const cards = result?.cards;
      
      // If successful, set the preview cards
      if (cards && cards.length > 0) {
        dispatch({ type: 'SET_PREVIEW_CARDS', payload: cards });
        
        // Create a subtle success message
        dispatch({ 
          type: 'SET_ERROR', 
          payload: `✨ Successfully generated ${cards.length} flashcards!` 
        });
      } else {
        throw new Error('No cards were generated. Please try different content.');
      }
    } catch (error) {
      let errorMessage = 'Failed to generate cards. Please try again.';
      
      // Detailed error logging for debugging
      console.error('[MODAL] Card generation error:', error);
      
      if (typeof error === 'object' && error !== null) {
        // Log all properties of the error object for debugging
        console.error('[MODAL] Error details:', {
          message: (error as any).message || 'No message',
          stack: (error as any).stack || 'No stack trace',
          name: (error as any).name || 'Unknown error type',
          toString: String(error),
          response: (error as any).response || 'No response data'
        });
        
        // Handle specific API errors
        if ((error as any).message) {
          const msg = (error as any).message;
          
          if (msg.includes('API key')) {
            errorMessage = 'OpenAI API key issue. Please check your configuration.';
          } else if (msg.includes('too many tokens')) {
            errorMessage = 'Your content is too long. Please try a shorter text or use a different source.';
          } else if (msg.includes('parse')) {
            errorMessage = 'Failed to parse the response from the server.';
          } else if (msg.includes('fetch')) {
            errorMessage = 'Network error: Could not connect to the API server. Please check if the server is running.';
          } else {
            // Use the actual error message if available
            errorMessage = `Error: ${msg}`;
          }
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('[MODAL] Generation error summary:', errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setProgressStage(0);
    }
  };

  const handleRegenerateCard = async (index: number) => {
    try {
      console.log('[MODAL] Regenerating card at index:', index);
      
      // Use CardsOnTheSpotAPI directly to generate a new deck
      // In a production app, you'd have a specific endpoint for single card regeneration
      const result = await CardsOnTheSpotAPI.generateDeck(state.newDeck);
      
      // Get a fresh card from the newly generated deck
      const freshCards = result.cards;
      const updatedCard = freshCards[index % freshCards.length]; // Use modulo to ensure valid index
      
      console.log('[MODAL] Successfully regenerated card:', updatedCard);
      
      dispatch({ 
        type: 'UPDATE_CARD', 
        payload: { index, card: updatedCard } 
      });
    } catch (error) {
      console.error('[MODAL] Failed to regenerate card:', error);
    }
  };

  const handleRegenerateAll = () => {
    handleGeneratePreview();
  };

  const handleCreateDeck = async () => {
    // In a completed app, we would require login first
    // But for our demo, we'll allow anyone to create decks
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Save the deck using the API service via utils
      const { user } = await createDeck(state.newDeck, state.previewCards);
      
      // Update the global state with the new user data (including the new deck)
      dispatch({ type: 'SET_USER', payload: user });
      
      // Success message and reset
      dispatch({ 
        type: 'SET_ERROR', 
        payload: '✨ Deck successfully created! You can view it on your dashboard.' 
      });
      
      // Show success alert with confetti animation
      const successElement = document.createElement('div');
      successElement.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50';
      successElement.innerHTML = `
        <div class="bg-white rounded-lg p-6 shadow-xl max-w-md w-full text-center transform transition-all animate-bounce-once">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-2">Deck Created Successfully!</h3>
          <p class="mb-4">Your new flashcard deck "${state.newDeck.title || 'Untitled Deck'}" is ready.</p>
          <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">View on Dashboard</button>
        </div>
      `;
      
      document.body.appendChild(successElement);
      
      // Auto close after animation
      setTimeout(() => {
        document.body.removeChild(successElement);
        onClose();
        window.location.href = '/dashboard';
      }, 2500);
      
      // Reset the new deck form
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to create deck. Please try again.' 
      });
      console.error(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEditCard = (index: number) => {
    setEditingCard(index);
    setEditValues({
      front: state.previewCards[index].front,
      back: state.previewCards[index].back
    });
  };

  const handleSaveCardEdit = (index: number) => {
    dispatch({
      type: 'UPDATE_CARD',
      payload: {
        index,
        card: {
          front: editValues.front,
          back: editValues.back
        }
      }
    });
    setEditingCard(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.size);
      
      // Store file name separately to avoid React rendering issues
      setSelectedFileName(file.name);
      
      // Update state with file object
      dispatch({
        type: 'UPDATE_NEW_DECK',
        payload: { sourceValue: file, sourceType: 'pdf' } // Set sourceValue to the file object and sourceType to 'pdf'
      });
    }
  };

return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="test-debug-class">
      {/* Header */}
      <div className="flex justify-between items-center border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Create New Deck</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      {/* <div className="flex-1 overflow-y-auto p-6">
        {/* Title */}
        <Input
          label="Deck Title"
          placeholder="Enter a title for your deck"
          value={state.newDeck.title}
          onChange={handleTitleChange}
          className="mb-6"
        />
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Deck</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <Input
            label="Deck Title"
            placeholder="Enter a title for your deck"
            value={state.newDeck.title}
            onChange={handleTitleChange}
            className="mb-6"
          />

          {/* Source Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Content
            </label>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            >
              {activeTab === 'pdf' && (
                <div className="mt-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <File className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF (up to 10MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  {selectedFileName && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFileName}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'url' && (
                <Input
                  placeholder="https://example.com/article"
                  value={typeof state.newDeck.sourceValue === 'string' ? state.newDeck.sourceValue : ''}
                  onChange={(e) => handleSourceValueChange(e.target.value)}
                  className="mt-4"
                />
              )}

              {activeTab === 'text' && (
                <TextArea
                  placeholder="Paste or type your content here..."
                  value={typeof state.newDeck.sourceValue === 'string' ? state.newDeck.sourceValue : ''}
                  onChange={(e) => handleSourceValueChange(e.target.value)}
                  className="mt-4"
                />
              )}
            </Tabs>
          </div>

          {/* Card Count */}
          <Slider
            label="Number of Cards"
            min={5}
            max={50}
            value={state.newDeck.cardCount}
            onChange={handleCardCountChange}
            className="mb-6"
            valueSuffix=" cards"
          />

          {/* Cloze Style */}
          <Toggle
            label="Cloze Style"
            options={[
              { value: 'single', label: 'Single Term' },
              { value: 'multi', label: 'Multiple Terms' },
            ]}
            value={state.newDeck.clozeStyle}
            onChange={handleClozeStyleChange}
          />

          <div className="mt-6 mb-4">
            <TextArea
              label="Custom Instructions (Optional)"
              placeholder="E.g., focus on definitions, include specific topics..."
              value={state.newDeck.instruction}
              onChange={handleInstructionChange}
            />
          </div>

          <div className="mt-6 mb-8">
            <TagInput
              label="Must Include Terms (Optional)"
              tags={state.newDeck.mustIncludeTerms || []}
              onChange={handleMustIncludeTermsChange}
              placeholder="Add terms to include..."
            />
          </div>

          {state.loading ? (
            <div className="animate-pulse">
              <div className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white relative overflow-hidden mb-4">
                <div className="absolute left-0 top-0 h-full bg-white/20" style={{
                  width: `${(progressStage + 1) * 20}%`,
                  transition: 'width 0.8s ease-in-out'
                }}></div>
                <div className="flex items-center z-10">
                  <Sparkles size={18} className="mr-2" />
                  <span>{generationProgress}</span>
                </div>
              </div>
              <div className="text-xs text-center text-gray-500">Processing with GPT-4o mini...</div>
            </div>
          ) : (
            <Button
              onClick={handleGeneratePreview}
              fullWidth
              size="lg"
              isLoading={state.loading}
            >
              Generate Preview
            </Button>
          )}

          {state.error && (
            <div className={`mt-4 p-3 text-sm rounded-md flex items-start ${
              state.error.includes('✨') 
                ? 'text-green-600 bg-green-50'
                : 'text-red-500 bg-red-50'
            }`}>
              {state.error.includes('✨') 
                ? <Sparkles size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                : <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              }
              <span>{state.error}</span>
            </div>
          )}

          {/* Preview Cards */}
          {state.previewCards.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Preview ({state.previewCards.length} cards)</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<RefreshCw size={16} />}
                  onClick={handleRegenerateAll}
                >
                  Regenerate All
                </Button>
              </div>

              <div className="space-y-5">
                {state.previewCards.map((card: Card, index: number) => (
                  <div key={index} className="border rounded-lg overflow-hidden bg-gray-50">
                    {editingCard === index ? (
                      <div className="p-4">
                        <TextArea
                          label="Front (Question)"
                          value={editValues.front}
                          onChange={(e) => setEditValues({ ...editValues, front: e.target.value })}
                          className="mb-3"
                        />
                        <TextArea
                          label="Back (Answer)"
                          value={editValues.back}
                          onChange={(e) => setEditValues({ ...editValues, back: e.target.value })}
                          className="mb-3"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingCard(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            icon={<Check size={16} />}
                            onClick={() => handleSaveCardEdit(index)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4">
                          <div className="font-medium text-gray-900 mb-3">
                            {card.front}
                          </div>
                          <div className="text-blue-600">
                            {card.back}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {card.sourcePage ? `Page ${card.sourcePage}` : 'No page'} • {card.contextSnippet}
                          </div>
                        </div>
                        <div className="flex border-t bg-white">
                          <button 
                            className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                            onClick={() => handleEditCard(index)}
                          >
                            <Pencil size={16} className="mr-1.5" />
                            Edit
                          </button>
                          <div className="w-px bg-gray-200"></div>
                          <button 
                            className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                            onClick={() => handleRegenerateCard(index)}
                          >
                            <RefreshCw size={16} className="mr-1.5" />
                            Regenerate
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button 
                  onClick={handleCreateDeck} 
                  fullWidth 
                  size="lg"
                  isLoading={state.loading}
                  variant="secondary"
                  icon={<Download size={18} />}
                >
                  Create Deck ({state.user ? (state.user.credits ? '1 credit' : 'Need credits') : 'Sign up'})
                </Button>
              </div>
            </div>
          )}
        </div> */
      </div>
    </div>
  );
};

export default DeckModal;