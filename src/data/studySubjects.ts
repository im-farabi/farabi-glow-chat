export interface Chapter {
  id: string;
  name: string;
  description: string;
  topics: string[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  chapters: Chapter[];
}

export const STUDY_SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: 'Calculator',
    color: 'hsl(210, 100%, 50%)',
    chapters: [
      {
        id: 'functions-equations',
        name: 'Functions & Equations',
        description: 'Linear, quadratic, exponential, logarithmic',
        topics: [
          'Linear equations',
          'Quadratic equations',
          'Exponential functions',
          'Logarithmic functions',
          'Graph interpretation',
          'Transformations'
        ]
      },
      {
        id: 'probability-statistics',
        name: 'Probability & Statistics',
        description: 'Combinatorics, probability rules, distributions',
        topics: [
          'Combinatorics',
          'Probability rules',
          'Distributions',
          'Data analysis',
          'Statistical inference'
        ]
      }
    ]
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: 'Atom',
    color: 'hsl(200, 100%, 50%)',
    chapters: [
      {
        id: 'mechanics',
        name: 'Mechanics',
        description: "Newton's laws, motion, forces, energy",
        topics: [
          "Newton's laws",
          'Kinematics',
          'Forces',
          'Energy',
          'Work',
          'Power',
          'Momentum'
        ]
      }
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'FlaskConical',
    color: 'hsl(160, 100%, 40%)',
    chapters: [
      {
        id: 'atomic-structure',
        name: 'Atomic Structure & Reactions',
        description: 'Atomic models, periodic table, stoichiometry',
        topics: [
          'Atomic models',
          'Periodic table trends',
          'Stoichiometry',
          'Balancing reactions',
          'Chemical bonding'
        ]
      }
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'Dna',
    color: 'hsl(120, 80%, 40%)',
    chapters: [
      {
        id: 'genetics-cell',
        name: 'Genetics & Cell Biology',
        description: 'DNA, genes, cell functions, division',
        topics: [
          'DNA structure',
          'Genes',
          'Cell functions',
          'Mitosis',
          'Meiosis',
          'Heredity'
        ]
      }
    ]
  }
];
