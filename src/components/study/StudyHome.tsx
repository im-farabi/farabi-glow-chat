import { useState } from 'react';
import { ArrowRight, ChevronRight, Settings, History } from 'lucide-react';
import { Calculator, Atom, FlaskConical, Dna } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDY_SUBJECTS, Subject, Chapter } from '@/data/studySubjects';

interface StudyHomeProps {
  userAge: number;
  onStartQuiz: (subject: Subject, chapter: Chapter, numQuestions: number) => void;
  onReset: () => void;
}

const QUESTION_COUNTS = [3, 5, 7, 10];

const iconMap: Record<string, React.ElementType> = {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
};

const StudyHome = ({ userAge, onStartQuiz, onReset }: StudyHomeProps) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const handleSubjectClick = (subject: Subject) => {
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null);
      setSelectedChapter(null);
    } else {
      setSelectedSubject(subject);
      setSelectedChapter(null);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  const handleStartQuiz = () => {
    if (selectedSubject && selectedChapter) {
      onStartQuiz(selectedSubject, selectedChapter, numQuestions);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              StudyME
            </h1>
            <p className="text-sm text-muted-foreground">
              Age {userAge} • Finnish Method
            </p>
          </div>
          <button
            onClick={onReset}
            className="p-2 rounded-lg hover:bg-card transition-colors"
            title="Reset settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Welcome message */}
        <div className="glass-card p-6 border border-blue-500/20 mb-8">
          <h2 className="text-lg font-semibold mb-2">
            Ready to learn? 🎯
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose a subject and chapter below. Questions are designed to teach you, not just test you.
          </p>
        </div>

        {/* Subject Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Subjects
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {STUDY_SUBJECTS.map(subject => {
              const IconComponent = iconMap[subject.icon] || Calculator;
              const isSelected = selectedSubject?.id === subject.id;
              
              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className={`
                    p-4 rounded-2xl text-left transition-all duration-300
                    ${isSelected 
                      ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                      : 'bg-card/50 hover:bg-card border-border hover:border-blue-500/30'}
                    border
                  `}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ 
                      backgroundColor: `${subject.color}20`,
                      color: subject.color
                    }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground">{subject.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subject.chapters.length} chapter{subject.chapters.length !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapters */}
        {selectedSubject && (
          <div className="mb-6 animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Chapters in {selectedSubject.name}
            </h3>
            <div className="space-y-2">
              {selectedSubject.chapters.map(chapter => {
                const isSelected = selectedChapter?.id === chapter.id;
                
                return (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterClick(chapter)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center justify-between
                      ${isSelected 
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50' 
                        : 'bg-card/50 hover:bg-card border-border hover:border-blue-500/30'}
                      border
                    `}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{chapter.name}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{chapter.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Count & Start */}
        {selectedChapter && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              How many questions?
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {QUESTION_COUNTS.map(count => (
                <button
                  key={count}
                  onClick={() => setNumQuestions(count)}
                  className={`
                    py-3 rounded-xl font-semibold transition-all duration-300
                    ${numQuestions === count 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                      : 'bg-card/50 text-foreground hover:bg-card border border-border'}
                  `}
                >
                  {count}
                </button>
              ))}
            </div>

            <Button
              onClick={handleStartQuiz}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all duration-300"
            >
              Start Learning
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Topics Preview */}
            <div className="mt-6 p-4 rounded-xl bg-card/30 border border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Topics covered:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedChapter.topics.map(topic => (
                  <span 
                    key={topic}
                    className="px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHome;
