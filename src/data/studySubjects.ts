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
        id: 'functions-graphs',
        name: 'Functions & Graphs',
        description: 'Linear, quadratic, polynomial, graphing',
        topics: ['Linear functions', 'Quadratic functions', 'Polynomial functions', 'Graph interpretation', 'Transformations', 'Domain and range']
      },
      {
        id: 'algebraic-equations',
        name: 'Algebraic Equations & Inequalities',
        description: 'Solving equations, systems, inequalities',
        topics: ['Linear equations', 'Quadratic equations', 'Systems of equations', 'Linear inequalities', 'Quadratic inequalities', 'Word problems']
      },
      {
        id: 'trigonometry',
        name: 'Trigonometry',
        description: 'Trig ratios, identities, applications',
        topics: ['Trigonometric ratios', 'Unit circle', 'Trigonometric identities', 'Inverse trig functions', 'Solving trig equations', 'Applications']
      },
      {
        id: 'calculus',
        name: 'Calculus',
        description: 'Limits, derivatives, integrals',
        topics: ['Limits', 'Continuity', 'Derivatives', 'Differentiation rules', 'Integrals', 'Applications of calculus']
      },
      {
        id: 'probability-statistics',
        name: 'Probability & Statistics',
        description: 'Combinatorics, probability, distributions',
        topics: ['Combinatorics', 'Probability rules', 'Conditional probability', 'Distributions', 'Mean, median, mode', 'Standard deviation']
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
        id: 'kinematics',
        name: 'Kinematics',
        description: 'Motion in 1D & 2D, velocity, acceleration',
        topics: ['Displacement', 'Velocity', 'Acceleration', 'Motion in 1D', 'Projectile motion', 'Relative motion']
      },
      {
        id: 'laws-of-motion',
        name: 'Laws of Motion',
        description: "Newton's laws, friction, circular motion",
        topics: ["Newton's first law", "Newton's second law", "Newton's third law", 'Friction', 'Circular motion', 'Free body diagrams']
      },
      {
        id: 'work-energy-power',
        name: 'Work, Energy & Power',
        description: 'Energy conservation, work-energy theorem',
        topics: ['Work', 'Kinetic energy', 'Potential energy', 'Conservation of energy', 'Power', 'Work-energy theorem']
      },
      {
        id: 'electricity-circuits',
        name: 'Electricity & Circuits',
        description: 'Current, resistance, Ohm\'s law',
        topics: ['Electric current', 'Voltage', 'Resistance', "Ohm's law", 'Series circuits', 'Parallel circuits']
      },
      {
        id: 'waves-optics',
        name: 'Waves & Optics',
        description: 'Light, sound, wave properties',
        topics: ['Wave properties', 'Sound waves', 'Light waves', 'Reflection', 'Refraction', 'Interference']
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
        name: 'Atomic Structure',
        description: 'Atomic models, electron configuration',
        topics: ['Atomic models', 'Subatomic particles', 'Electron configuration', 'Quantum numbers', 'Orbitals', 'Isotopes']
      },
      {
        id: 'periodic-table',
        name: 'Periodic Table & Trends',
        description: 'Element properties, periodicity',
        topics: ['Periodic table organization', 'Periodic trends', 'Atomic radius', 'Ionization energy', 'Electronegativity', 'Metallic character']
      },
      {
        id: 'chemical-bonding',
        name: 'Chemical Bonding',
        description: 'Ionic, covalent, metallic bonds',
        topics: ['Ionic bonds', 'Covalent bonds', 'Metallic bonds', 'Lewis structures', 'VSEPR theory', 'Molecular geometry']
      },
      {
        id: 'stoichiometry',
        name: 'Stoichiometry',
        description: 'Mole concept, calculations, limiting reagents',
        topics: ['Mole concept', 'Molar mass', 'Balancing equations', 'Limiting reagents', 'Percent yield', 'Empirical formulas']
      },
      {
        id: 'acids-bases-redox',
        name: 'Acids, Bases & Redox',
        description: 'pH, neutralization, oxidation-reduction',
        topics: ['Acids and bases', 'pH scale', 'Neutralization', 'Oxidation states', 'Redox reactions', 'Electrochemistry basics']
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
        id: 'cell-structure',
        name: 'Cell Structure & Function',
        description: 'Organelles, cell types, membrane',
        topics: ['Cell theory', 'Prokaryotic cells', 'Eukaryotic cells', 'Cell organelles', 'Cell membrane', 'Transport mechanisms']
      },
      {
        id: 'genetics',
        name: 'Genetics',
        description: 'DNA, Mendel, inheritance patterns',
        topics: ['DNA structure', 'DNA replication', 'Mendelian genetics', 'Punnett squares', 'Inheritance patterns', 'Genetic disorders']
      },
      {
        id: 'cell-division',
        name: 'Cell Division',
        description: 'Mitosis, meiosis, cell cycle',
        topics: ['Cell cycle', 'Mitosis', 'Meiosis', 'Cytokinesis', 'Chromosomes', 'Genetic variation']
      },
      {
        id: 'human-body-systems',
        name: 'Human Body Systems',
        description: 'Circulatory, respiratory, digestive, nervous',
        topics: ['Circulatory system', 'Respiratory system', 'Digestive system', 'Nervous system', 'Immune system', 'Homeostasis']
      },
      {
        id: 'evolution',
        name: 'Evolution & Natural Selection',
        description: 'Darwin, adaptation, speciation',
        topics: ['Natural selection', 'Adaptation', 'Speciation', 'Evidence for evolution', 'Genetic drift', 'Hardy-Weinberg equilibrium']
      }
    ]
  }
];
