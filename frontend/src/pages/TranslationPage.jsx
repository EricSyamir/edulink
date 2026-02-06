import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, MicOff, Globe, Languages, Volume2, MoveRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = [
    { code: 'ms', name: 'Malay' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Mandarin' },
    { code: 'ta', name: 'Tamil' }
];

export default function TranslationPage() {
    // Use the standalone translation API backend on Fly.io
    const API_URL = import.meta.env.VITE_TRANSLATION_API_URL || 'https://edulink-translation-api.fly.dev';

    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('ms');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // Initialize Web Speech API
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;

            // Set language based on source selection (default to English if auto)
            recognitionInstance.lang = sourceLang === 'auto' ? 'en-US' :
                sourceLang === 'ms' ? 'ms-MY' :
                    sourceLang === 'zh' ? 'zh-CN' :
                        sourceLang === 'ta' ? 'ta-MY' : 'en-US';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsRecording(false);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                toast.error('Voice input failed. Please try again.');
            };

            recognitionInstance.onend = () => {
                setIsRecording(false);
            };

            setRecognition(recognitionInstance);
        } else {
            console.warn('Web Speech API not supported');
        }
    }, [sourceLang]);

    const toggleRecording = () => {
        if (!recognition) {
            toast.error('Voice input is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                setIsRecording(true);
            } catch (err) {
                console.error(err);
                // If already started, stop and restart
                try {
                    recognition.stop();
                    setTimeout(() => {
                        recognition.start();
                        setIsRecording(true);
                    }, 100);
                } catch (e) {
                    toast.error("Could not start microphone");
                }
            }
        }
    };

    const handleTranslate = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/translation/`, {
                text: inputText,
                source_lang: sourceLang,
                target_lang: targetLang
            });

            setOutputText(response.data.translated_text);
            toast.success('Translation completed!');
        } catch (error) {
            console.error('Translation error:', error);
            toast.error(error.response?.data?.detail || 'Translation failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = () => {
        if (!outputText) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(outputText);

            // Map app language codes to preferred BCP 47 language tags
            const langMap = {
                'ms': 'ms-MY',  // Malay
                'en': 'en-US',  // English
                'zh': 'zh-CN',  // Mandarin
                'ta': 'ta-MY'   // Tamil
            };

            const targetTag = langMap[targetLang] || 'en-US';
            utterance.lang = targetTag;
            utterance.rate = 0.8; // Slightly slower for better clarity

            // Enhanced Voice Selection logic
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = voices.find(voice => voice.lang === targetTag);

            if (!selectedVoice) {
                const langCode = targetTag.split('-')[0];
                selectedVoice = voices.find(voice => voice.lang.startsWith(langCode));
            }

            if (!selectedVoice && targetTag.startsWith('ta')) {
                // Fallback for Tamil if specific region not found
                selectedVoice = voices.find(voice => voice.lang === 'ta-IN');
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error('Text-to-speech is not supported in this browser.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTranslate();
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 min-h-screen flex flex-col justify-center py-12">
            <div className="flex items-center space-x-3 mb-6 animate-fade-in">
                <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                    <Globe className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 font-display">AI Translator</h1>
                    <p className="text-surface-500">Instant translation with voice support</p>
                </div>
            </div>

            <div className="card overflow-hidden animate-slide-up">
                {/* Language Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-surface-50 border-b border-surface-200 gap-4">
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="input w-full md:w-48 py-2"
                    >
                        <option value="auto">Detect Language</option>
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>

                    <MoveRight className="w-5 h-5 text-surface-400 hidden md:block" />

                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="input w-full md:w-48 py-2"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>

                {/* Translation Area */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-surface-200">
                    {/* Input Section */}
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type or speak to translate..."
                                className="w-full h-48 resize-none border-0 focus:ring-0 p-0 text-lg bg-transparent placeholder-surface-400 focus:outline-none text-surface-900"
                            />
                            <div className="absolute bottom-0 right-0 flex items-center space-x-2">
                                <button
                                    onClick={toggleRecording}
                                    className={`p-3 rounded-full transition-colors ${isRecording
                                        ? 'bg-red-100 text-red-600 animate-pulse'
                                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                        }`}
                                    title="Voice Input"
                                >
                                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm text-surface-400">
                            <span>{inputText.length} chars</span>
                            {isRecording && <span className="text-red-500 font-medium">Listening...</span>}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="p-6 bg-surface-50/50">
                        {isLoading ? (
                            <div className="h-48 flex items-center justify-center text-surface-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : (
                            <div className="h-48 text-lg text-surface-800 whitespace-pre-wrap">
                                {outputText || <span className="text-surface-400 italic">Translation will appear here...</span>}
                            </div>
                        )}

                        {outputText && (
                            <div className="flex justify-end mt-4 space-x-3">
                                <button
                                    onClick={handlePlayAudio}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 transition-colors"
                                    title="Listen"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    <span>Listen</span>
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(outputText);
                                        toast.success('Copied to clipboard!');
                                    }}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="p-4 border-t border-surface-200 bg-surface-50 flex justify-end">
                    <button
                        onClick={handleTranslate}
                        disabled={!inputText.trim() || isLoading}
                        className="btn-primary"
                    >
                        <Languages className="w-5 h-5" />
                        <span>Translate</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
