import React, { useState, useRef, useEffect } from 'react';
import { File, Link, Type, X, Pencil, RefreshCw, Download, Check, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Tabs from '../ui/Tabs';
import Slider from '../ui/Slider';
import Toggle from '../ui/Toggle';
import TagInput from '../ui/TagInput';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../context/AuthContext'; // Added for token refresh
import { supabase } from '../../lib/supabaseClient'; // Added for Edge Function call
import { createDeck } from '../../lib/utils';
import { CardifyAPI } from '../../lib/api';
import { Card } from '../../types';

// Moved progressStages outside the component as it's a constant
const progressStages = [
  'Analyzing content...',
  'Identifying key concepts...',
  'Generating cloze cards...',
  'Refining cards...',
  'Finalizing flashcards...'
];

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated?: () => void; // Callback for when a deck is successfully created
}

const DeckModal: React.FC<DeckModalProps> = ({ isOpen, onClose, onDeckCreated }) => {
  const auth = useAuth(); // Added for token refresh
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'url'>('text');
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ front: '', back: '' });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuccessfullySubmitted, setIsSuccessfullySubmitted] = useState(false);
  const [generatedDeckId, setGeneratedDeckId] = useState<string | null>(null);
  
  // Track generation progress feedback
  const [generationProgress, setGenerationProgress] = useState('');
  const [progressStage, setProgressStage] = useState(0);

  // Use effect to simulate progress through stages
  useEffect(() => {
    if (isOpen) {
      setIsSuccessfullySubmitted(false); // Reset on modal open
      setGeneratedDeckId(null); // Reset generated deck ID on modal open
    }
  }, [isOpen]);

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
    const validTabId = (tabId === 'text' || tabId === 'pdf' || tabId === 'url') ? tabId as 'text' | 'pdf' | 'url' : 'text';
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
    dispatch({
      type: 'UPDATE_NEW_DECK',
      payload: { title: e.target.value }
    });
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
      payload: { clozeStyle: value as 'single' | 'multi' | 'qa' }
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

  const handleGeneratePreview = async () => {
    setGeneratedDeckId(null); // Reset at the start of new generation
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

    // --- BEGIN SPEND TOKEN LOGIC ---
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        dispatch({ type: 'SET_ERROR', payload: 'Authentication error. Please sign in again.' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const spendTokenResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spend-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const spendTokenResult = await spendTokenResponse.json();

      if (!spendTokenResponse.ok) {
        const errorMessage = spendTokenResult.error || 'Failed to process token for card generation.';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
        return; // Stop deck generation
      }
      console.log('Token spent successfully:', spendTokenResult.message);
      // Token spent, proceed to card generation
    } catch (tokenError: any) {
      console.error('[MODAL] Error spending token:', tokenError);
      dispatch({ type: 'SET_ERROR', payload: `Error processing token: ${tokenError.message || 'Please try again.'}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    // --- END SPEND TOKEN LOGIC ---

    try {
      console.log('[MODAL] Starting card generation with state:', {
        title: state.newDeck.title,
        sourceType: state.newDeck.sourceType,
        cardCount: state.newDeck.cardCount,
        clozeStyle: state.newDeck.clozeStyle,
        hasContent: !!state.newDeck.sourceValue
      });
      
      // Use CardifyAPI directly - this is what worked in the test page
      const result = await CardifyAPI.generateDeck(state.newDeck);
      console.log('[MODAL] Generation result:', result);
      
      // Capture the generated deck ID
      if (result && result.id) {
        setGeneratedDeckId(result.id);
      }

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
    } catch (err: unknown) {
      let errorMessage = 'Failed to generate cards. Please try again.';
      
      console.error('[MODAL] Card generation error:', err);

      let errorDetails: { message?: string; stack?: string; name?: string; response?: unknown; stringRepresentation?: string } = {};
      let messageFromError: string | undefined;

      if (err instanceof Error) {
        errorDetails.message = err.message;
        errorDetails.stack = err.stack;
        errorDetails.name = err.name;
        messageFromError = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // For non-Error objects, try to get message and name if they exist
        errorDetails.message = (err as { message?: string }).message;
        errorDetails.name = (err as { name?: string }).name;
        messageFromError = (err as { message?: string }).message;
      }
      
      // Try to get 'response' if it's an object with a response property
      if (typeof err === 'object' && err !== null && 'response' in err) {
        errorDetails.response = (err as { response: unknown }).response;
      }
      
      errorDetails.stringRepresentation = String(err);

      console.error('[MODAL] Error details:', errorDetails);
        
      if (messageFromError) {
        const msg = messageFromError;
        if (msg.includes('API key')) {
          errorMessage = 'OpenAI API key issue. Please check your configuration.';
        } else if (msg.includes('too many tokens')) {
          errorMessage = 'Your content is too long. Please try a shorter text or use a different source.';
        } else if (msg.includes('parse')) {
          errorMessage = 'Failed to parse the response from the server.';
        } else if (msg.includes('fetch')) {
          errorMessage = 'Network error: Could not connect to the API server. Please check if the server is running.';
        } else {
          errorMessage = `Error: ${msg}`;
        }
      } else {
        // Fallback if no message could be extracted
        errorMessage = 'An unexpected error occurred. Please check the console for details.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('[MODAL] Generation error summary:', errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setProgressStage(0);
      // If cards were generated (implies token was spent and generation was attempted)
      // and there's no overriding error message preventing UI update for tokens.
      // A more robust check might be needed if SET_ERROR is used for non-fatal warnings.
      if (state.previewCards.length > 0 && !state.error?.toLowerCase().includes('token')) { // Check if previewCards has items
        auth.refreshUserProfile();
      }
    }
  };

  const handleRegenerateCard = async (index: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const updatedCard = await CardifyAPI.generateDeck({
        ...state.newDeck,
        cardCount: 1
      });
      
      if (updatedCard.cards && updatedCard.cards.length > 0) {
        dispatch({
          type: 'UPDATE_CARD',
          payload: {
            index,
            card: updatedCard.cards[0]
          }
        });
      }
    } catch (error) {
      console.error('Failed to regenerate card:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to regenerate card.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  const handleRegenerateAll = () => {
    handleGeneratePreview();
  };

  const handleCreateDeck = async () => {
    console.log(`[DeckModal] handleCreateDeck called at: ${new Date().toISOString()}, generatedDeckId: ${generatedDeckId}`);
    // Validate preview cards
    if (!state.previewCards || state.previewCards.length === 0) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'No cards to save. Please generate cards first.',
      });
      return;
    }

    // Validate title
    if (!state.newDeck.title || !state.newDeck.title.trim()) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please provide a title for your deck.',
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      let finalDeckId: string | undefined;

      if (generatedDeckId) {
        console.log(`[DeckModal] Using existing generatedDeckId: ${generatedDeckId}`);
        finalDeckId = generatedDeckId;
        // If the title or other deck properties could have been edited in the UI *after* generation
        // but *before* clicking "Save Deck", an API call to update the deck might be needed here.
        // For example: await CardifyAPI.updateDeck(generatedDeckId, { title: state.newDeck.title, ... });
        // For now, we assume the deck created by /api/generate-deck is final or uses the latest title.
      } else {
        // This case should ideally not be hit if cards have been generated,
        // as generation should provide a generatedDeckId.
        console.warn('[DeckModal] No generatedDeckId found. Proceeding to create a new deck via createDeck utility.');
        const creationResult = await createDeck(
          state.newDeck,
          state.previewCards
        );
        finalDeckId = creationResult?.deckId;
        // User info is typically associated with deck creation, handle if present
        if (creationResult && creationResult.user) {
          dispatch({ type: 'SET_USER', payload: creationResult.user });
        }
      }

      if (finalDeckId) {
        dispatch({
          type: 'SET_ERROR',
          payload: '🎉 Deck successfully saved!', // Success message
        });
        
        // Call onDeckCreated to trigger UI updates like refreshing the deck list
        if (onDeckCreated) {
          onDeckCreated();
        }
        
        setIsSuccessfullySubmitted(true); // Prevent further clicks and manage UI state
        dispatch({ type: 'RESET_NEW_DECK' }); // Clear the form

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // This means neither generatedDeckId was available, nor createDeck returned a valid ID
        throw new Error('Deck operation failed: No valid deck ID was obtained.');
      }
    } catch (err: any) { // Catching 'any' for broader error handling from API calls
      console.error('[MODAL] Error in handleCreateDeck:', err);
      let errorMessage = 'Failed to save deck. Please try again.';
      if (err && err.message) {
        // Customize error messages based on common issues
        if (err.message.includes('credits')) {
          errorMessage = 'You do not have enough credits to create this deck.';
        } else if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Authentication error. Please ensure you are signed in.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleEditCard = (index: number) => {
    const card = state.previewCards[index];
    if (card) {
      setEditValues({
        front: card.front,
        back: card.back
      });
      setEditingCard(index);
    } else {
      console.error(`Card at index ${index} not found for editing.`);
      // Optionally dispatch an error or set a message in the UI
    }
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
      
      // Store filename for display purposes
      setSelectedFileName(file.name);
      
      // Update state with the file object for API handling
      dispatch({
        type: 'UPDATE_NEW_DECK',
        payload: { sourceValue: file }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
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

          {/* Options */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Cards
              </label>
              <Slider
                min={5}
                max={50}
                step={5}
                value={state.newDeck.cardCount}
                onChange={handleCardCountChange}
              />
              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>5 cards</span>
                <span>{state.newDeck.cardCount} cards</span>
                <span>50 cards</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Format
              </label>
              <Toggle
                options={[
                  { value: 'single', label: 'Cloze Deletion' },
                  { value: 'qa', label: 'Question & Answer' }
                ]}
                value={state.newDeck.clozeStyle}
                onChange={handleClozeStyleChange}
              />
            </div>

            <div>
              <TextArea
                label="Additional Instructions (Optional)"
                placeholder="E.g., Focus on specific topics, use simple language, etc."
                value={state.newDeck.instruction}
                onChange={handleInstructionChange}
              />
            </div>

            <div>
              <TagInput
                label="Must Include Terms (Optional)"
                placeholder="Add terms..."
                tags={state.newDeck.mustIncludeTerms || []}
                onChange={handleMustIncludeTermsChange}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-6">
            <Button
              onClick={handleGeneratePreview}
              fullWidth
              size="lg"
              isLoading={state.loading}
              disabled={state.loading}
              icon={<Sparkles size={18} />}
            >
              {state.loading ? generationProgress : 'Generate Flashcards'}
            </Button>
            {state.error && (
              <div className={`mt-3 text-sm p-3 rounded ${state.error.startsWith('✓') || state.error.startsWith('✨') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'} flex items-start`}>
                <AlertCircle className={`h-5 w-5 mr-2 flex-shrink-0 ${state.error.startsWith('✓') || state.error.startsWith('✨') ? 'text-green-500' : 'text-red-500'}`} />
                <p>{state.error}</p>
              </div>
            )}
          </div>

          {/* Preview Cards */}
          {state.previewCards.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview ({state.previewCards.length} cards)
                </h3>
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
                  isLoading={state.loading || isSuccessfullySubmitted}
                  variant="secondary"
                  icon={<Download size={18} />}
                >
                  Save Deck
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckModal;
