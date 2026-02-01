import { useState, useEffect } from 'react';
import StudyBackground from '@/components/study/StudyBackground';
import StudyIntro from '@/components/study/StudyIntro';
import StudySetup from '@/components/study/StudySetup';
import StudyHome from '@/components/study/StudyHome';
import StudyQuiz from '@/components/study/StudyQuiz';
import StudyResults from '@/components/study/StudyResults';
import { Subject, Chapter } from '@/data/studySubjects';
import { 
  getStudyUserData, 
  saveStudyUserData, 
  saveStudyAttempt,
  resetStudyUser,
  StudyUserData 
} from '@/lib/studyStorage';

type ViewState = 'intro' | 'setup' | 'home' | 'quiz' | 'results';

interface QuizState {
  subject: Subject;
  chapter: Chapter;
  numQuestions: number;
}

interface ResultState {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  subjectName: string;
  chapterName: string;
}

const Study = () => {
  const [view, setView] = useState<ViewState>('intro');
  const [userData, setUserData] = useState<StudyUserData | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [resultState, setResultState] = useState<ResultState | null>(null);

  // Load user data on mount
  useEffect(() => {
    const savedData = getStudyUserData();
    if (savedData?.setupComplete) {
      setUserData(savedData);
      setView('home');
    }
  }, []);

  const handleIntroStart = () => {
    setView('setup');
  };

  const handleSetupComplete = (age: number) => {
    const newUserData: StudyUserData = {
      age,
      setupComplete: true,
      lastVisit: Date.now()
    };
    saveStudyUserData(newUserData);
    setUserData(newUserData);
    setView('home');
  };

  const handleSetupBack = () => {
    setView('intro');
  };

  const handleStartQuiz = (subject: Subject, chapter: Chapter, numQuestions: number) => {
    setQuizState({ subject, chapter, numQuestions });
    setView('quiz');
  };

  const handleQuizComplete = (score: number, totalQuestions: number, timeSpent: number) => {
    if (!quizState) return;

    // Save attempt to history
    const attemptId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    saveStudyAttempt({
      id: attemptId,
      subject: quizState.subject.name,
      chapter: quizState.chapter.name,
      score,
      totalQuestions,
      timestamp: Date.now(),
      timeSpent
    });

    setResultState({
      score,
      totalQuestions,
      timeSpent,
      subjectName: quizState.subject.name,
      chapterName: quizState.chapter.name
    });
    setView('results');
  };

  const handleQuizBack = () => {
    setQuizState(null);
    setView('home');
  };

  const handleRetry = () => {
    if (quizState) {
      setResultState(null);
      setView('quiz');
    }
  };

  const handleNewTopic = () => {
    setQuizState(null);
    setResultState(null);
    setView('home');
  };

  const handleReset = () => {
    resetStudyUser();
    setUserData(null);
    setQuizState(null);
    setResultState(null);
    setView('intro');
  };

  return (
    <div className="min-h-screen">
      <StudyBackground />
      
      {view === 'intro' && (
        <StudyIntro onStart={handleIntroStart} />
      )}

      {view === 'setup' && (
        <StudySetup 
          onComplete={handleSetupComplete} 
          onBack={handleSetupBack} 
        />
      )}

      {view === 'home' && userData && (
        <StudyHome 
          userAge={userData.age}
          onStartQuiz={handleStartQuiz}
          onReset={handleReset}
        />
      )}

      {view === 'quiz' && quizState && userData && (
        <StudyQuiz
          subject={quizState.subject}
          chapter={quizState.chapter}
          numQuestions={quizState.numQuestions}
          userAge={userData.age}
          onComplete={handleQuizComplete}
          onBack={handleQuizBack}
        />
      )}

      {view === 'results' && resultState && (
        <StudyResults
          score={resultState.score}
          totalQuestions={resultState.totalQuestions}
          timeSpent={resultState.timeSpent}
          subjectName={resultState.subjectName}
          chapterName={resultState.chapterName}
          onRetry={handleRetry}
          onNewTopic={handleNewTopic}
        />
      )}
    </div>
  );
};

export default Study;
