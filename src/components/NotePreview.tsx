import React from 'react';

interface NotePreviewProps {
  title: string;
  shortDescription?: string;
  description: string;
  colorTheme: 'black-purple' | 'black-white' | 'black-orange';
  className?: string;
}

const themeClasses = {
  'black-purple': {
    background: 'bg-gradient-to-br from-purple-950 to-black',
    title: 'text-purple-300',
    text: 'text-purple-100',
    border: 'border-purple-500/30',
    shortDesc: 'text-purple-200/80',
  },
  'black-white': {
    background: 'bg-gradient-to-br from-gray-900 to-black',
    title: 'text-white',
    text: 'text-gray-200',
    border: 'border-gray-500/30',
    shortDesc: 'text-gray-300/80',
  },
  'black-orange': {
    background: 'bg-gradient-to-br from-orange-950 to-black',
    title: 'text-orange-300',
    text: 'text-orange-100',
    border: 'border-orange-500/30',
    shortDesc: 'text-orange-200/80',
  },
};

export const NotePreview: React.FC<NotePreviewProps> = ({
  title,
  shortDescription,
  description,
  colorTheme,
  className = '',
}) => {
  const theme = themeClasses[colorTheme];

  return (
    <div className={`${theme.background} ${theme.border} border rounded-lg p-6 ${className}`}>
      <h1 className={`${theme.title} text-3xl font-bold mb-3`}>
        {title || 'Untitled Note'}
      </h1>
      
      {shortDescription && (
        <p className={`${theme.shortDesc} text-sm mb-4 italic`}>
          {shortDescription}
        </p>
      )}
      
      <div className={`${theme.text} whitespace-pre-wrap break-words`}>
        {description || 'No description provided.'}
      </div>
    </div>
  );
};