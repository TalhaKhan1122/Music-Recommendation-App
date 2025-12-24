import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, CloseIcon } from './icons';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
  onError,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setTranscript('');
      setInterimTranscript('');
      transcriptRef.current = '';
      interimTranscriptRef.current = '';
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
      }
      return;
    }

    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    console.log('🎤 Checking Speech Recognition support:', {
      SpeechRecognition: !!SpeechRecognition,
      webkitSpeechRecognition: !!(window as any).webkitSpeechRecognition,
      window: window,
    });

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      console.log('🎤 Speech Recognition initialized:', recognition);
      
      recognition.continuous = true; // Keep listening until stopped
      recognition.interimResults = true; // Show interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Voice recognition result:', event);
        let interim = '';
        let final = '';

        // Process all results from the beginning
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        // Update interim transcript (what user is currently saying)
        if (interim) {
          console.log('🎤 Interim transcript:', interim);
          setInterimTranscript(interim);
          interimTranscriptRef.current = interim;
        }

        // Update final transcript (confirmed words)
        if (final.trim()) {
          const finalText = final.trim();
          console.log('🎤 Final transcript:', finalText);
          setTranscript((prev) => {
            const newTranscript = prev ? prev + ' ' + finalText : finalText;
            transcriptRef.current = newTranscript;
            return newTranscript;
          });
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 Speech recognition error:', event.error, event.message);
        setIsListening(false);
        
        let errorMessage = 'Voice recognition error occurred.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            // Don't show error for no-speech, just restart
            setTimeout(() => {
              if (recognitionRef.current && isOpen) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.error('Failed to restart:', e);
                }
              }
            }, 1000);
            return; // Don't show error toast
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone connection.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'aborted':
            errorMessage = 'Voice recognition was aborted.';
            return; // Don't show error for aborted
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed. Please check your browser settings.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}. ${event.message || ''}`;
        }

        if (onError) {
          onError(errorMessage);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        
        // Use refs to get the latest transcript values
        const currentTranscript = transcriptRef.current || interimTranscriptRef.current;
        console.log('🎤 Current transcript on end:', currentTranscript);
        
        if (currentTranscript.trim()) {
          const finalText = currentTranscript.trim();
          console.log('🎤 Searching for:', finalText);
          setTimeout(() => {
            onTranscript(finalText);
            onClose();
          }, 500);
        } else {
          // If no speech detected, restart listening after a short delay
          console.log('🎤 No transcript, will restart listening...');
          setTimeout(() => {
            if (recognitionRef.current && isOpen) {
              try {
                console.log('🎤 Restarting recognition...');
                recognitionRef.current.start();
              } catch (e) {
                console.error('🎤 Failed to restart:', e);
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;

      // Auto-start listening when modal opens
      const startRecognition = () => {
        try {
          console.log('🎤 Attempting to start recognition...');
          console.log('🎤 Recognition state:', {
            continuous: recognition.continuous,
            interimResults: recognition.interimResults,
            lang: recognition.lang,
          });
          
          // Check if already started
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Ignore if not running
            }
          }
          
          recognition.start();
          console.log('🎤 Recognition started successfully');
        } catch (error: any) {
          console.error('🎤 Error starting recognition:', error);
          console.error('🎤 Error details:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
          });
          setIsListening(false);
          if (onError) {
            onError(`Failed to start voice recognition: ${error?.message || 'Unknown error'}. Please check microphone permissions and try again.`);
          }
        }
      };

      // Request microphone permission first, then start
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🎤 Requesting microphone permission...');
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            console.log('🎤 Microphone permission granted, stream:', stream);
            // Stop the stream tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
            // Start recognition after a short delay
            setTimeout(() => {
              startRecognition();
            }, 500);
          })
          .catch((err) => {
            console.error('🎤 Microphone permission denied:', err);
            setIsListening(false);
            if (onError) {
              onError(`Microphone permission denied: ${err.message}. Please allow microphone access in your browser settings and try again.`);
            }
          });
      } else {
        console.log('🎤 getUserMedia not available, starting recognition directly...');
        // Fallback for browsers that don't support getUserMedia
        setTimeout(() => {
          startRecognition();
        }, 500);
      }
    } else {
      setIsSupported(false);
      if (onError) {
        onError('Your browser does not support voice recognition. Please use Chrome, Edge, or Safari.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [isOpen]); // Removed dependencies to prevent re-initialization

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        console.log('🎤 Stopping recognition...');
        recognitionRef.current.stop();
      } catch (error) {
        console.error('🎤 Error stopping recognition:', error);
      }
      setIsListening(false);
      
      // Use refs to get the latest transcript values
      const currentTranscript = transcriptRef.current || interimTranscriptRef.current;
      console.log('🎤 Stopped listening, current transcript:', currentTranscript);
      
      if (currentTranscript.trim()) {
        const finalText = currentTranscript.trim();
        console.log('🎤 Final search text:', finalText);
        setTimeout(() => {
          onTranscript(finalText);
          onClose();
        }, 500);
      }
    }
  };

  const handleClose = () => {
    stopListening();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-3xl border border-white/20 bg-[#09060f]/95 p-8 shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon size={24} />
        </button>

        <div className="flex flex-col items-center space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Voice Search</h2>
            <p className="text-sm text-white/60">
              {isListening 
                ? 'Listening... Speak now' 
                : isSupported 
                ? 'Click microphone to start' 
                : 'Voice recognition not supported'}
            </p>
            {!isSupported && (
              <p className="text-xs text-red-400 mt-2">
                Please use Chrome, Edge, or Safari for voice search
              </p>
            )}
          </div>

          {/* Microphone Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else if (recognitionRef.current && isSupported) {
                  // Request permission and start
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ audio: true })
                      .then(() => {
                        try {
                          recognitionRef.current?.start();
                        } catch (error) {
                          console.error('Error starting recognition:', error);
                          if (onError) {
                            onError('Failed to start listening. Please try again.');
                          }
                        }
                      })
                      .catch((err) => {
                        console.error('Microphone permission denied:', err);
                        if (onError) {
                          onError('Microphone permission denied. Please allow access.');
                        }
                      });
                  } else {
                    try {
                      recognitionRef.current?.start();
                    } catch (error) {
                      console.error('Error starting recognition:', error);
                      if (onError) {
                        onError('Failed to start listening. Please try again.');
                      }
                    }
                  }
                }
              }}
              disabled={!isSupported}
              className={`
                relative flex items-center justify-center
                w-24 h-24 rounded-full
                transition-all duration-300
                ${isListening
                  ? 'bg-red-500/20 text-red-400 scale-110'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }
                ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400
              `}
            >
              <MicIcon size={40} className={isListening ? 'animate-pulse' : ''} />
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <span className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                </>
              )}
            </button>
          </div>
          
          {/* Manual Stop Button */}
          {isListening && (
            <button
              type="button"
              onClick={stopListening}
              className="px-6 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-colors"
            >
              Stop & Search
            </button>
          )}

          {/* Transcript Display */}
          <div className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-6">
            {(transcript || interimTranscript) ? (
              <div className="space-y-2">
                {transcript && (
                  <p className="text-base text-white font-medium">{transcript}</p>
                )}
                {interimTranscript && (
                  <p className="text-base text-white/60 italic">
                    {interimTranscript}
                    <span className="inline-block w-2 h-4 ml-1 bg-white/60 animate-pulse" />
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[120px]">
                <p className="text-sm text-white/40 text-center">
                  {isListening
                    ? 'Listening... Speak now...'
                    : isSupported
                    ? 'Click the microphone to start listening'
                    : 'Voice recognition not supported in this browser'}
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>Listening...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;

