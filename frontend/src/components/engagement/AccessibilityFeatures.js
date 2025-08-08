import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Type, Contrast, 
         Zap, ZapOff, Mic, MicOff, Settings } from 'lucide-react';

// Accessibility Context
const AccessibilityContext = createContext({
  settings: {},
  updateSetting: () => {},
  announceToScreenReader: () => {}
});

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Vision
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    focusRing: true,
    
    // Audio
    soundEnabled: true,
    hapticEnabled: true,
    voiceAnnouncements: false,
    
    // Input
    voiceInput: false,
    longPressDelay: 500,
    swipeThreshold: 50,
    
    // Cognitive
    simplifiedUI: false,
    confirmActions: false,
    showProgress: true
  });

  const screenReaderRef = useRef(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
    
    // Check for system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply CSS variables for accessibility
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    if (!screenReaderRef.current || !settings.voiceAnnouncements) return;
    
    screenReaderRef.current.setAttribute('aria-live', priority);
    screenReaderRef.current.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (screenReaderRef.current) {
        screenReaderRef.current.textContent = '';
      }
    }, 1000);
  }, [settings.voiceAnnouncements]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announceToScreenReader }}>
      {children}
      {/* Screen Reader Announcements */}
      <div
        ref={screenReaderRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
};

// Accessibility Settings Panel
export const AccessibilitySettings = ({ isOpen = false, onClose = () => {} }) => {
  const { settings, updateSetting } = useContext(AccessibilityContext);

  if (!isOpen) return null;

  const settingSections = [
    {
      title: 'Vision',
      icon: Eye,
      settings: [
        { key: 'highContrast', label: 'High Contrast Mode', icon: Contrast },
        { key: 'largeText', label: 'Large Text', icon: Type },
        { key: 'reducedMotion', label: 'Reduce Motion', icon: ZapOff }
      ]
    },
    {
      title: 'Audio & Feedback',
      icon: Volume2,
      settings: [
        { key: 'soundEnabled', label: 'Sound Effects', icon: Volume2 },
        { key: 'hapticEnabled', label: 'Haptic Feedback', icon: Zap },
        { key: 'voiceAnnouncements', label: 'Voice Announcements', icon: Mic }
      ]
    },
    {
      title: 'Input',
      icon: Settings,
      settings: [
        { key: 'voiceInput', label: 'Voice Input', icon: Mic },
        { key: 'confirmActions', label: 'Confirm Actions', icon: Settings }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Accessibility Settings</h2>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={onClose}
              aria-label="Close accessibility settings"
            >
              <EyeOff size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {settingSections.map(section => (
            <div key={section.title}>
              <div className="flex items-center space-x-2 mb-3">
                <section.icon size={20} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>

              <div className="space-y-3">
                {section.settings.map(setting => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <setting.icon size={16} className="text-gray-500" />
                      <label className="text-sm font-medium text-gray-700">
                        {setting.label}
                      </label>
                    </div>
                    
                    <AccessibilityToggle
                      checked={settings[setting.key]}
                      onChange={(checked) => updateSetting(setting.key, checked)}
                      aria-label={`Toggle ${setting.label}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Slider Settings */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Touch Sensitivity</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Long Press Duration: {settings.longPressDelay}ms
                </label>
                <AccessibilitySlider
                  min={300}
                  max={1000}
                  step={100}
                  value={settings.longPressDelay}
                  onChange={(value) => updateSetting('longPressDelay', value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Swipe Threshold: {settings.swipeThreshold}px
                </label>
                <AccessibilitySlider
                  min={20}
                  max={100}
                  step={10}
                  value={settings.swipeThreshold}
                  onChange={(value) => updateSetting('swipeThreshold', value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600">
            Settings are automatically saved and will be remembered for future visits.
          </p>
        </div>
      </div>
    </div>
  );
};

// Accessible Toggle Switch
export const AccessibilityToggle = ({ 
  checked = false, 
  onChange = () => {},
  disabled = false,
  'aria-label': ariaLabel,
  ...props 
}) => {
  const { settings } = useContext(AccessibilityContext);

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`
        relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none
        ${settings.focusRing ? 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2' : ''}
        ${checked 
          ? (settings.highContrast ? 'bg-black' : 'bg-red-500') 
          : (settings.highContrast ? 'bg-gray-800' : 'bg-gray-300')
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      {...props}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
          ${checked ? 'transform translate-x-6' : ''}
        `}
      />
    </button>
  );
};

// Accessible Slider
export const AccessibilitySlider = ({ 
  min = 0, 
  max = 100, 
  step = 1, 
  value = 50, 
  onChange = () => {},
  'aria-label': ariaLabel,
  ...props 
}) => {
  const { settings } = useContext(AccessibilityContext);
  const sliderRef = useRef(null);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative">
      <input
        ref={sliderRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        className={`
          w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
          ${settings.focusRing ? 'focus:outline-none focus:ring-2 focus:ring-red-500' : ''}
          slider
        `}
        {...props}
      />
      
      {/* Custom track fill */}
      <div
        className={`
          absolute top-0 left-0 h-2 rounded-lg pointer-events-none
          ${settings.highContrast ? 'bg-black' : 'bg-red-500'}
        `}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Voice Input Component
export const VoiceInput = ({ 
  onTranscript = () => {},
  onStart = () => {},
  onEnd = () => {},
  continuous = true,
  language = 'en-US'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const { settings, announceToScreenReader } = useContext(AccessibilityContext);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        onStart();
        announceToScreenReader('Voice input started');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        onEnd();
        announceToScreenReader('Voice input ended');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        onTranscript(fullTranscript, event.results[event.results.length - 1].isFinal);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        announceToScreenReader(`Voice input error: ${event.error}`);
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, language, onStart, onEnd, onTranscript, announceToScreenReader]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported || !settings.voiceInput) {
    return null;
  }

  return (
    <div className="voice-input-container">
      <button
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }
          ${settings.focusRing ? 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2' : ''}
        `}
        onClick={toggleListening}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        <span>{isListening ? 'Stop' : 'Voice'}</span>
      </button>

      {transcript && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          <strong>Heard:</strong> {transcript}
        </div>
      )}
    </div>
  );
};

// Screen Reader Optimized Components
export const ScreenReaderContent = ({ 
  children, 
  announcement = '', 
  priority = 'polite' 
}) => {
  const { announceToScreenReader } = useContext(AccessibilityContext);

  useEffect(() => {
    if (announcement) {
      announceToScreenReader(announcement, priority);
    }
  }, [announcement, priority, announceToScreenReader]);

  return <div className="sr-only">{children}</div>;
};

// Enhanced Focus Management
export const FocusManager = ({ children, trapFocus = false }) => {
  const containerRef = useRef(null);
  const { settings } = useContext(AccessibilityContext);

  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus]);

  return (
    <div 
      ref={containerRef}
      className={settings.focusRing ? 'focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2' : ''}
    >
      {children}
    </div>
  );
};

// High Contrast Button
export const HighContrastButton = ({ children, variant = 'primary', ...props }) => {
  const { settings } = useContext(AccessibilityContext);

  const getButtonClass = () => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
    const focusRing = settings.focusRing ? 'focus:outline-none focus:ring-2 focus:ring-offset-2' : '';

    if (settings.highContrast) {
      return `${base} ${focusRing} ${
        variant === 'primary' 
          ? 'bg-black text-white hover:bg-gray-800 focus:ring-black' 
          : 'bg-white text-black border-2 border-black hover:bg-gray-100 focus:ring-black'
      }`;
    }

    return `${base} ${focusRing} ${
      variant === 'primary'
        ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
    }`;
  };

  return (
    <button className={getButtonClass()} {...props}>
      {children}
    </button>
  );
};

// Accessible Card Component
export const AccessibleCard = ({ 
  children, 
  title = '', 
  description = '',
  onClick = null,
  tabIndex = 0,
  ...props 
}) => {
  const { settings } = useContext(AccessibilityContext);
  const cardRef = useRef(null);

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={cardRef}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? tabIndex : -1}
      aria-label={title ? `${title}. ${description}` : description}
      className={`
        rounded-lg border p-4 transition-all duration-200
        ${settings.highContrast 
          ? 'border-black bg-white text-black' 
          : 'border-gray-200 bg-white text-gray-900'
        }
        ${onClick 
          ? `cursor-pointer hover:shadow-lg ${settings.focusRing ? 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2' : ''}` 
          : ''
        }
        ${settings.reducedMotion ? '' : 'hover:scale-105'}
      `}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  AccessibilityProvider,
  AccessibilitySettings,
  AccessibilityToggle,
  AccessibilitySlider,
  VoiceInput,
  ScreenReaderContent,
  FocusManager,
  HighContrastButton,
  AccessibleCard,
  AccessibilityContext
};