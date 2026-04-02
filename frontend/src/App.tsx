import { useState, useRef, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Profile from './components/Profile';

type WordBankItem = {
  word: string;
  addedAt: string;
  sourceLevel: string;
};

function App() {
  const [user, setUser] = useState<{id: number, username: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'dashboard' | 'profile' | 'guide' | 'wordBank'>('practice');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const wordBankStorageKey = user ? `speech_therapy_word_bank_v1_${user.id}` : "";

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!profileMenuRef.current) return;
      const target = e.target as Node | null;
      if (target && profileMenuRef.current.contains(target)) return;
      setIsProfileMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(wordBankStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWordBank(parsed);
      } else {
        setWordBank([]);
      }
    } catch {
      setWordBank([]);
    }
  }, [user, wordBankStorageKey]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(wordBankStorageKey, JSON.stringify(wordBank));
    } catch {
      // ignore storage failures
    }
  }, [user, wordBank, wordBankStorageKey]);

  const addWordsToBank = (words: string[], sourceLevel: string) => {
    if (!words.length) return;
    setWordBank(prev => {
      const existing = new Set(prev.map(w => w.word.toLowerCase()));
      const additions = words
        .map(w => w.trim())
        .filter(Boolean)
        .filter(w => !existing.has(w.toLowerCase()))
        .map(w => ({ word: w, addedAt: new Date().toISOString(), sourceLevel }));
      return additions.length ? [...additions, ...prev] : prev;
    });
  };

  const removeWordFromBank = (word: string) => {
    setWordBank(prev => prev.filter(w => w.word.toLowerCase() !== word.toLowerCase()));
  };

  const clearWordBank = () => {
    setWordBank([]);
  };

  if (!user) {
    return (
      <div className="app-container relative">
        <div className="bg-image-layer"></div>
        <Auth onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="app-container relative">
      <div className="bg-image-layer"></div>
      <header className="app-header glass">
        <div className="header-content">
          <div className="logo-group cursor-pointer" onClick={() => setActiveTab('practice')}>
            <div className="logo-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="logo-text">
              <h1>Speech Therapy</h1>
              <p>Your AI Speech Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="profile-menu-anchor" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(v => !v)} 
                className="profile-avatar-btn"
                title={`Logged in as ${user.username}`}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {user.username.charAt(0).toUpperCase()}
              </button>

              {isProfileMenuOpen && (
                <div className="profile-menu glass-card" role="menu">
                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => { setActiveTab('profile'); setIsProfileMenuOpen(false); }}
                    role="menuitem"
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    className="profile-menu-item danger"
                    onClick={() => { setIsProfileMenuOpen(false); setUser(null); }}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-shell">
        <aside className="app-sidebar glass-card" aria-label="Primary navigation">
          <button
            type="button"
            className={`sidebar-item ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('practice')}
          >
            Practice Area
          </button>
          <button
            type="button"
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`sidebar-item ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            Therapy Guide
          </button>
          <button
            type="button"
            className={`sidebar-item ${activeTab === 'wordBank' ? 'active' : ''}`}
            onClick={() => setActiveTab('wordBank')}
          >
            Word Bank
          </button>
        </aside>

        <main className="main-content main-content-shell relative" key={activeTab}>
          <div className="page-enter">
            {activeTab === 'practice' && (
              <PracticeArea
                userId={user.id}
                onAddWordsToBank={addWordsToBank}
                wordBankCount={wordBank.length}
              />
            )}
            {activeTab === 'dashboard' && <Dashboard userId={user.id} />}
            {activeTab === 'guide' && <TherapyGuide />}
            {activeTab === 'wordBank' && (
              <WordBank
                words={wordBank}
                onRemoveWord={removeWordFromBank}
                onClearAll={clearWordBank}
              />
            )}
            {activeTab === 'profile' && <Profile userId={user.id} onLogout={() => setUser(null)} onUpdateUser={(u: any) => setUser({ ...user, ...u })} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function TherapyGuide() {
  return (
    <div className="fade-in">
      <div className="card glass-card">
        <div className="card-gradient-top"></div>
        <p className="label text-indigo">Vocal Coaching</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Daily Therapy Guide
        </h2>
        <p className="text-muted text-med" style={{ marginBottom: '1.5rem' }}>
          Quick, evidence-based habits to improve clarity and confidence alongside your practice exercises.
        </p>

        <div className="feedback-section glass" style={{ marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Warm‑up (2 minutes)</h4>
          <p className="text-muted">Gentle lip trills + slow nasal humming. Keep volume low and relaxed.</p>
        </div>
        <div className="feedback-section glass" style={{ marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Articulation (3 minutes)</h4>
          <p className="text-muted">Over‑enunciate consonants: “t‑d‑k‑g”, then read one practice sentence slowly.</p>
        </div>
        <div className="feedback-section glass">
          <h4 style={{ marginBottom: '0.5rem' }}>Consistency Tip</h4>
          <p className="text-muted">Aim for 1 short session daily. Progress beats intensity.</p>
        </div>
      </div>
    </div>
  );
}

function WordBank({
  words,
  onRemoveWord,
  onClearAll
}: {
  words: WordBankItem[];
  onRemoveWord: (word: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="fade-in">
      <div className="card glass-card">
        <div className="card-gradient-top"></div>
        <div className="card-header">
          <h2>Word Bank</h2>
        </div>
        <p className="text-muted text-med" style={{ marginBottom: '1rem' }}>
          Saved difficult words from your assessments. Revisit them anytime for focused drill practice.
        </p>
        <div className="word-bank-toolbar">
          <span className="word-bank-count">{words.length} saved</span>
          <button type="button" className="btn-primary btn-secondary-lite" onClick={onClearAll} disabled={words.length === 0}>
            Clear All
          </button>
        </div>
        {words.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">No words yet. Use "Save Weak Words" from Practice results.</p>
          </div>
        ) : (
          <div className="word-bank-list">
            {words.map(item => (
              <div key={`${item.word}-${item.addedAt}`} className="word-bank-item">
                <div>
                  <p className="word-bank-word">{item.word}</p>
                  <p className="word-bank-meta text-muted">From {item.sourceLevel} level</p>
                </div>
                <button
                  type="button"
                  className="btn-primary btn-secondary-lite"
                  onClick={() => onRemoveWord(item.word)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeArea({ userId, onAddWordsToBank, wordBankCount }: { userId: number; onAddWordsToBank: (words: string[], sourceLevel: string) => void; wordBankCount: number; }) {
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const language = "en-US";
  const [activeLevelId, setActiveLevelId] = useState<'basic' | 'intermediate' | 'advanced' | 'expert'>('basic');
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);
  const [currentExercise, setCurrentExercise] = useState("");
  const [completedByLevel, setCompletedByLevel] = useState<Record<string, number[]>>({});
  const [weakDrillWords, setWeakDrillWords] = useState<string[]>([]);
  const [isWeakDrillMode, setIsWeakDrillMode] = useState(false);
  const [weakDrillIdx, setWeakDrillIdx] = useState(0);
  const [dailyStats, setDailyStats] = useState<{ lastDate: string; streak: number; todayCompletions: number }>({
    lastDate: "",
    streak: 0,
    todayCompletions: 0,
  });
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const previousLockedStateRef = useRef<Record<string, boolean>>({});

  const LEVELS: Array<{ id: 'basic' | 'intermediate' | 'advanced' | 'expert'; title: string; subtitle: string; sentences: string[]; }> = [
    {
      id: 'basic',
      title: 'Basic',
      subtitle: 'Clear, short sentences',
      sentences: [
        "I can speak clearly.",
        "Today is a good day.",
        "Please pass the water.",
        "I will try again.",
        "I speak slowly and calmly.",
        "My voice is steady.",
      ],
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      subtitle: 'Longer rhythm + pacing',
      sentences: [
        "I practice speaking with a relaxed jaw and steady breath.",
        "Clear pronunciation comes from patience and consistent practice.",
        "I will pause briefly between phrases to improve my clarity.",
        "My goal is to speak confidently in everyday conversations.",
        "I listen to my words and adjust my pace when needed.",
        "I focus on crisp consonants and smooth transitions.",
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      subtitle: 'Precision + articulation',
      sentences: [
        "The therapist emphasized articulation, accuracy, and a controlled speaking tempo.",
        "I can enunciate challenging consonant clusters without rushing the sentence.",
        "Breath support helps me maintain volume and clarity across longer phrases.",
        "When I slow down, my pronunciation improves and my message lands better.",
        "I will repeat difficult words carefully until they sound natural and smooth.",
        "Consistent practice builds neural pathways that strengthen my speech habits.",
      ],
    },
    {
      id: 'expert',
      title: 'Expert',
      subtitle: 'Complex structure + fluency',
      sentences: [
        "Although I feel nervous, I can communicate effectively by pacing myself and articulating each syllable with intention.",
        "By combining breath control, clear consonants, and natural intonation, I can speak with confidence in demanding situations.",
        "If I notice tension in my jaw or throat, I will reset, breathe, and restart the sentence with a calmer rhythm.",
        "The most important skill is consistency: short sessions every day create lasting improvement over time.",
        "Even when I make mistakes, I stay composed, correct gently, and continue speaking without losing flow.",
        "I will deliver this message with clarity, warmth, and a steady, engaging tone.",
      ],
    },
  ];

  const progressStorageKey = `speech_therapy_progress_v1_${userId}_${language}`;
  const dailyStatsStorageKey = `speech_therapy_daily_stats_v1_${userId}`;
  const sessionGoal = 5;

  const getLevel = (levelId: typeof activeLevelId) => LEVELS.find(l => l.id === levelId)!;
  const getCompletedSet = (levelId: string) => new Set(completedByLevel[levelId] ?? []);
  const getTodayKey = () => new Date().toISOString().slice(0, 10);
  const getYesterdayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  const getCompletionPct = (levelId: typeof activeLevelId) => {
    const level = getLevel(levelId);
    const done = (completedByLevel[levelId] ?? []).length;
    return Math.round((done / level.sentences.length) * 100);
  };
  const isLevelLocked = (levelId: typeof activeLevelId) => {
    const idx = LEVELS.findIndex(l => l.id === levelId);
    if (idx <= 0) return false;
    const previousLevelId = LEVELS[idx - 1].id;
    return getCompletionPct(previousLevelId) < 80;
  };

  const setExerciseFromState = (levelId: typeof activeLevelId, sentenceIdx: number) => {
    const level = getLevel(levelId);
    const boundedIdx = Math.min(Math.max(sentenceIdx, 0), level.sentences.length - 1);
    setActiveLevelId(levelId);
    setActiveSentenceIdx(boundedIdx);
    setCurrentExercise(level.sentences[boundedIdx] ?? "");
  };

  const buildCoachTip = (data: any) => {
    if (!data) return "";
    const pronunciation = Number(data.pronunciation_score ?? 0);
    const fluency = Number(data.fluency_score ?? 0);
    const accuracy = Number(data.accuracy_score ?? 0);
    const completeness = Number(data.completeness_score ?? 0);

    if (fluency < 70) {
      return "Coach Tip: Slow your pace slightly and add tiny pauses between phrases to improve fluency.";
    }
    if (accuracy < 75) {
      return "Coach Tip: Focus on crisp consonants (t, d, k, g) and repeat difficult words 3 times.";
    }
    if (completeness < 80) {
      return "Coach Tip: Keep your breath steady and finish each sentence fully before stopping.";
    }
    if (pronunciation >= 90) {
      return "Coach Tip: Excellent clarity. Keep your current rhythm and challenge yourself with longer phrases.";
    }
    return "Coach Tip: Good progress. Maintain volume consistency and clear endings on each word.";
  };

  useEffect(() => {
    // Load progress from localStorage for this user + language
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setCompletedByLevel(parsed);
      }
    } catch {
      // ignore invalid storage
    }

    // Load streak/session progress
    try {
      const raw = localStorage.getItem(dailyStatsStorageKey);
      const today = getTodayKey();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.lastDate === today) {
            setDailyStats({
              lastDate: today,
              streak: Number(parsed.streak) || 0,
              todayCompletions: Number(parsed.todayCompletions) || 0,
            });
          } else {
            setDailyStats({
              lastDate: parsed.lastDate || "",
              streak: Number(parsed.streak) || 0,
              todayCompletions: 0,
            });
          }
        }
      }
    } catch {
      // ignore invalid storage
    }

    // Reset to a sane starting point on language/user change
    setExerciseFromState('basic', 0);
    setResults(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(completedByLevel));
    } catch {
      // ignore storage failures
    }
  }, [completedByLevel, progressStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(dailyStatsStorageKey, JSON.stringify(dailyStats));
    } catch {
      // ignore storage failures
    }
  }, [dailyStats, dailyStatsStorageKey]);

  useEffect(() => {
    const currentLockedState: Record<string, boolean> = {};
    LEVELS.forEach(level => {
      currentLockedState[level.id] = isLevelLocked(level.id);
    });

    const prev = previousLockedStateRef.current;
    for (const level of LEVELS) {
      if (prev[level.id] && !currentLockedState[level.id]) {
        setUnlockToast(`${level.title} level unlocked!`);
        break;
      }
    }
    previousLockedStateRef.current = currentLockedState;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedByLevel]);

  useEffect(() => {
    if (!unlockToast) return;
    const timer = window.setTimeout(() => setUnlockToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [unlockToast]);

  useEffect(() => {
    if (!results) return;

    // Mark a sentence as completed when pronunciation is decent
    const pass = typeof results.pronunciation_score === 'number' ? results.pronunciation_score >= 75 : false;
    if (!pass) return;

    if (isWeakDrillMode) {
      const nextWeak = Math.min(weakDrillIdx + 1, Math.max(0, weakDrillWords.length - 1));
      setWeakDrillIdx(nextWeak);
      setCurrentExercise(weakDrillWords[nextWeak] ?? currentExercise);
      return;
    }

    let addedNewCompletion = false;
    setCompletedByLevel(prev => {
      const existing = new Set(prev[activeLevelId] ?? []);
      if (existing.has(activeSentenceIdx)) return prev;
      existing.add(activeSentenceIdx);
      addedNewCompletion = true;
      return { ...prev, [activeLevelId]: Array.from(existing).sort((a, b) => a - b) };
    });

    if (addedNewCompletion) {
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      setDailyStats(prev => {
        if (prev.lastDate === today) {
          return { ...prev, todayCompletions: prev.todayCompletions + 1 };
        }
        const nextStreak = prev.lastDate === yesterday ? prev.streak + 1 : 1;
        return { lastDate: today, streak: nextStreak, todayCompletions: 1 };
      });

      window.setTimeout(() => {
        const level = getLevel(activeLevelId);
        if (activeSentenceIdx < level.sentences.length - 1) {
          setExerciseFromState(activeLevelId, activeSentenceIdx + 1);
          setResults(null);
          return;
        }

        const currentLevelIdx = LEVELS.findIndex(l => l.id === activeLevelId);
        const nextLevel = LEVELS[currentLevelIdx + 1];
        if (nextLevel && !isLevelLocked(nextLevel.id)) {
          setExerciseFromState(nextLevel.id, 0);
          setResults(null);
        }
      }, 650);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, activeLevelId, activeSentenceIdx, isWeakDrillMode, weakDrillIdx, weakDrillWords]);

  const goNextSentence = () => {
    if (isWeakDrillMode) {
      const nextWeak = Math.min(weakDrillIdx + 1, Math.max(0, weakDrillWords.length - 1));
      setWeakDrillIdx(nextWeak);
      setCurrentExercise(weakDrillWords[nextWeak] ?? currentExercise);
      setResults(null);
      return;
    }
    const level = getLevel(activeLevelId);
    const nextIdx = Math.min(activeSentenceIdx + 1, level.sentences.length - 1);
    setExerciseFromState(activeLevelId, nextIdx);
    setResults(null);
  };

  const goPrevSentence = () => {
    if (isWeakDrillMode) {
      const prevWeak = Math.max(weakDrillIdx - 1, 0);
      setWeakDrillIdx(prevWeak);
      setCurrentExercise(weakDrillWords[prevWeak] ?? currentExercise);
      setResults(null);
      return;
    }
    const prevIdx = Math.max(activeSentenceIdx - 1, 0);
    setExerciseFromState(activeLevelId, prevIdx);
    setResults(null);
  };

  const jumpToLevel = (levelId: typeof activeLevelId) => {
    if (isLevelLocked(levelId)) return;
    setIsWeakDrillMode(false);
    const completedSet = getCompletedSet(levelId);
    const level = getLevel(levelId);
    const firstIncomplete = level.sentences.findIndex((_, i) => !completedSet.has(i));
    setExerciseFromState(levelId, firstIncomplete === -1 ? 0 : firstIncomplete);
    setResults(null);
  };

  const speakSentence = () => {
    if (!('speechSynthesis' in window) || !currentExercise) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentExercise);
    utterance.lang = language;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  };

  const startWeakWordDrill = (words: string[]) => {
    if (!words.length) return;
    setWeakDrillWords(words);
    setIsWeakDrillMode(true);
    setWeakDrillIdx(0);
    setCurrentExercise(words[0]);
    setResults(null);
  };

  const exitWeakWordDrill = () => {
    setIsWeakDrillMode(false);
    setWeakDrillIdx(0);
    setExerciseFromState(activeLevelId, activeSentenceIdx);
    setResults(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      finalTranscriptRef.current = "";
      setInterimText("");

      mediaRecorder.ondataavailable = (event) => {
         audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setTimeout(() => {
           const fullSpokenText = finalTranscriptRef.current;
           sendAudioToBackend(audioBlob, fullSpokenText);
        }, 500);
        stream.getTracks().forEach(track => track.stop());
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        
        recognition.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += event.results[i][0].transcript + ' ';
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          setInterimText(finalTranscriptRef.current + currentInterim);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert("Your browser does not support the Web Speech API.");
      }

      mediaRecorder.start();
      setIsRecording(true);
      setResults(null);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to practice pronunciation.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob, spokenText: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('spoken_text', spokenText);
    formData.append('expected_text', currentExercise);
    formData.append('user_id', userId.toString());

    try {
      const response = await fetch('http://localhost:8000/api/assess-speech', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Server responded with an error");
      const data = await response.json();
      setTimeout(() => {
        setResults(data.results);
        setIsAnalyzing(false);
      }, 500); 
    } catch (error) {
      console.error("Failed to fetch assessment from backend.", error);
      setIsAnalyzing(false);
      alert("Failed to analyze audio. Is the backend running?");
    }
  };

  return (
    <div className="practice-container fade-in">
      <div className="exercise-header">
        <h2>Practice Path</h2>
      </div>

      {unlockToast && (
        <div className="level-unlock-toast" role="status" aria-live="polite">
          <span className="level-unlock-icon">✨</span>
          <span>{unlockToast}</span>
        </div>
      )}

      <div className="session-goal-card glass-card">
        <div className="session-goal-top">
          <div>
            <p className="label text-indigo">Session Goal</p>
            <h3>{Math.min(dailyStats.todayCompletions, sessionGoal)}/{sessionGoal} completed today</h3>
            <p className="text-muted">Current streak: <span className="session-goal-streak">{dailyStats.streak} day{dailyStats.streak === 1 ? "" : "s"}</span></p>
          </div>
          <div className={`session-goal-badge ${dailyStats.todayCompletions >= sessionGoal ? 'done' : ''}`}>
            {dailyStats.todayCompletions >= sessionGoal ? "Goal met" : "In progress"}
          </div>
        </div>
        <div className="session-bank-hint">Word Bank: <strong>{wordBankCount}</strong> saved</div>
        <div className="session-goal-progress">
          <div
            className="session-goal-progress-bar"
            style={{ width: `${Math.min(100, Math.round((dailyStats.todayCompletions / sessionGoal) * 100))}%` }}
          />
        </div>
      </div>

      <div className="level-grid">
        {LEVELS.map((level, idx) => {
          const done = (completedByLevel[level.id] ?? []).length;
          const total = level.sentences.length;
          const pct = Math.round((done / total) * 100);
          const isActive = level.id === activeLevelId;
          const locked = isLevelLocked(level.id);
          const prevLevelTitle = idx > 0 ? LEVELS[idx - 1].title : "";

          return (
            <button
              key={level.id}
              type="button"
              className={`level-card glass-card ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => jumpToLevel(level.id)}
              disabled={isRecording || locked}
            >
              <div className="level-card-top">
                <div>
                  <div className="level-title">{level.title}</div>
                  <div className="level-subtitle">
                    {locked ? `Unlock at 80% of ${prevLevelTitle}` : level.subtitle}
                  </div>
                </div>
                <div className="level-metric">
                  {locked ? (
                    <span className="level-lock-mark">🔒</span>
                  ) : (
                    <>
                      <span className="level-count">{done}/{total}</span>
                      <span className="level-percent">{pct}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="level-progress">
                <div className="level-progress-bar" style={{ width: `${locked ? 0 : pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="card glass-card hero-card">
        <div className="card-gradient-top"></div>
        <div className="mock-display">
          <div className="level-now">
            <span className="level-badge">{isWeakDrillMode ? "Weak Word Drill" : `${getLevel(activeLevelId).title} Level`}</span>
            <div className="level-now-right">
              <div className="sentence-nav-inline">
                <button
                  type="button"
                  onClick={goPrevSentence}
                  disabled={isRecording || (isWeakDrillMode ? weakDrillIdx === 0 : activeSentenceIdx === 0)}
                  className="sentence-nav-btn"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={goNextSentence}
                  disabled={isRecording || (isWeakDrillMode ? weakDrillIdx === Math.max(0, weakDrillWords.length - 1) : activeSentenceIdx === getLevel(activeLevelId).sentences.length - 1)}
                  className="sentence-nav-btn primary"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                className="sentence-audio-btn"
                onClick={speakSentence}
                title="Read sentence aloud"
                aria-label="Read sentence aloud"
                disabled={isRecording}
              >
                🔊
              </button>
              <button
                type="button"
                className="sentence-audio-btn stop"
                onClick={stopSpeaking}
                title="Stop audio"
                aria-label="Stop audio"
                disabled={isRecording}
              >
                ⏹
              </button>
            </div>
          </div>
          <p className="label text-indigo">Practice Sentence</p>
          <p className="big-text">"{currentExercise}"</p>
        </div>

        {isRecording && interimText && (
          <div className="transcription-box">
             <p className="label">Live Transcription Capture:</p>
             <p className="transcription-text">"{interimText}"</p>
          </div>
        )}

        <div className="controls-area">
          {isAnalyzing ? (
             <div className="loading-state">
              <div className="spinner"></div>
              <p className="pulse-text">Python NLP is evaluating your pronunciation...</p>
            </div>
          ) : (
            <div className="button-wrapper">
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`record-btn ${isRecording ? 'recording' : 'idle'}`}
              >
                {isRecording ? (
                  <>
                    <span className="pulse-dot"></span>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg className="icon-med" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start Recording
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="card glass-card fade-in results-card">
          <div className="results-header">
            <div className="icon-box success-light">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Assessment Results</h3>
          </div>
          
          <div className="score-grid">
            <ScoreCard title="Accuracy" score={results.accuracy_score} desc="Word correctness" />
            <ScoreCard title="Fluency" score={results.fluency_score} desc="Rhythm and pace" />
            <ScoreCard title="Completeness" score={results.completeness_score} desc="Words spoken vs skipped" />
            <ScoreCard title="Pronunciation" score={results.pronunciation_score} desc="Overall vocal score" />
          </div>

          <div className="feedback-section glass">
            <h4>Detailed Word Feedback:</h4>
            <div className="word-badges">
              {results.words.map((w: any, idx: number) => {
                const isPerfect = w.accuracy_score >= 90;
                const isGood = w.accuracy_score >= 70 && w.accuracy_score < 90;
                let statusClass = 'error';
                if (isPerfect) statusClass = 'perfect';
                else if (isGood) statusClass = 'good';

                return (
                  <div key={idx} className={`word-badge ${statusClass}`} title={`${w.error_type} | Score: ${w.accuracy_score}`}>
                    <span>{w.word}</span>
                    <span className="badge-score">{w.accuracy_score}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="feedback-section glass coach-tip-card">
            <h4>AI Coach Feedback</h4>
            <p className="text-muted">{buildCoachTip(results)}</p>
            {results.words && (
              <div className="weak-drill-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const weakWords: string[] = Array.from(
                      new Set(
                        results.words
                          .filter((w: any) => Number(w.accuracy_score ?? 0) < 70)
                          .map((w: any) => String(w.word ?? "").trim())
                          .filter((w: string) => w.length > 0)
                      )
                    );
                    startWeakWordDrill(weakWords);
                  }}
                  disabled={!results.words.some((w: any) => Number(w.accuracy_score ?? 0) < 70)}
                >
                  {results.words.some((w: any) => Number(w.accuracy_score ?? 0) < 70) ? "Practice Weak Words" : "No weak words found"}
                </button>
                <button
                  type="button"
                  className="btn-primary btn-secondary-lite"
                  onClick={() => {
                    const weakWords: string[] = Array.from(
                      new Set(
                        results.words
                          .filter((w: any) => Number(w.accuracy_score ?? 0) < 70)
                          .map((w: any) => String(w.word ?? "").trim())
                          .filter((w: string) => w.length > 0)
                      )
                    );
                    onAddWordsToBank(weakWords, getLevel(activeLevelId).title);
                  }}
                  disabled={!results.words.some((w: any) => Number(w.accuracy_score ?? 0) < 70)}
                >
                  Save Weak Words
                </button>
                {isWeakDrillMode && (
                  <button type="button" className="btn-primary btn-secondary-lite" onClick={exitWeakWordDrill}>
                    Exit Drill
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ title, score, desc }: { title: string, score: number, desc: string }) {
  let statusClass = 'success';
  if (score < 80) statusClass = 'warning';
  if (score < 60) statusClass = 'danger';

  return (
    <div className={`metric-card ${statusClass}`}>
      <div className="metric-gradient"></div>
      <div className="metric-content">
        <span className="metric-title">{title}</span>
        <span className="metric-number">{score}</span>
        <span className="metric-desc">{desc}</span>
      </div>
    </div>
  );
}

export default App;
