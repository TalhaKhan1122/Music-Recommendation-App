import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './icons';

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onTranscript,
  onError,
  disabled = false,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; // Stop after user stops speaking
      recognition.interimResults = true; // Show interim results (what user is saying in real-time)
      recognition.lang = 'en-US'; // Default to English, can be made configurable

      recognition.onstart = () => {
        setIsListening(true);
        setHasPermission(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Show interim results in real-time (what user is currently saying)
        if (interimTranscript && onInterimTranscript) {
          onInterimTranscript(interimTranscript);
        }

        // When final result is ready, use it
        if (finalTranscript.trim()) {
          const finalText = finalTranscript.trim();
          onTranscript(finalText);
          setIsListening(false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        
        let errorMessage = 'Voice recognition error occurred.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone.';
            setHasPermission(false);
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            setHasPermission(false);
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Voice recognition was aborted.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }

        if (onError) {
          onError(errorMessage);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
      // Don't show error immediately, just log it
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [onTranscript, onError]);

  const startListening = () => {
    if (!isSupported) {
      if (onError) {
        onError('Your browser does not support voice recognition. Please use Chrome, Edge, or Safari.');
      }
      return;
    }
    if (disabled || isListening) {
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error: any) {
        setIsListening(false);
        if (onError) {
          onError('Failed to start voice recognition. Please try again.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore errors
      }
      setIsListening(false);
    }
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Always show the button, but disable it if not supported
  // This way users can see it exists even if their browser doesn't support it
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center
        rounded-full p-2
        transition-all duration-200
        ${isListening
          ? 'bg-red-500/20 text-red-400'
          : 'text-white/70 hover:text-white hover:bg-white/10'
        }
        ${disabled || !isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400
        ${className}
      `}
      title={
        isListening
          ? 'Click to stop listening'
          : hasPermission === false
          ? 'Microphone permission denied. Click to try again.'
          : 'Click to start voice search'
      }
      aria-label={isListening ? 'Stop listening' : 'Start voice search'}
    >
      <MicIcon size={20} className={isListening ? 'animate-pulse' : ''} />
      {isListening && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="absolute h-full w-full rounded-full bg-red-500/20 animate-ping" />
        </span>
      )}
    </button>
  );
};

export default VoiceSearch;

