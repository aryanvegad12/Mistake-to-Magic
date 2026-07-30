// Single source of truth for subject / type / stream options on the client.
// These lists must stay in sync with the enums in server/models/Mistake.js and
// server/models/User.js — keep them here so pages can't drift apart.

export const SUBJECTS = {
  Physics:     { color:'#e74c3c', icon:'⚛️' },
  Chemistry:   { color:'#8e44ad', icon:'🧪' },
  Maths:       { color:'#2980b9', icon:'📐' },
  Biology:     { color:'#27ae60', icon:'🌿' },
  English:     { color:'#d35400', icon:'✍️' },
  Computer:    { color:'#16a085', icon:'💻' },
  Accountancy: { color:'#a0522d', icon:'🧾' },
  Economics:   { color:'#2c3e50', icon:'📈' },
  Other:       { color:'#7c3aed', icon:'📚' },
};

export const SUBJECT_NAMES = Object.keys(SUBJECTS);

export const subjectMeta = (subject) => SUBJECTS[subject] || SUBJECTS.Other;

// Which subjects to offer for each stream (matches User.stream enum)
export const STREAM_SUBJECTS = {
  'Science (PCM)':  ['Physics','Chemistry','Maths','Computer','English'],
  'Science (PCB)':  ['Physics','Chemistry','Biology','Computer','English'],
  'Science (PCMB)': ['Physics','Chemistry','Maths','Biology','Computer','English'],
  'Commerce':       ['Accountancy','Economics','Maths','English','Computer'],
  'Arts':           ['English','Economics','Computer','Other'],
  'Other':          SUBJECT_NAMES,
};

export const subjectsForStream = (stream) => STREAM_SUBJECTS[stream] || SUBJECT_NAMES;

export const STREAMS = ['Science (PCM)','Science (PCB)','Science (PCMB)','Commerce','Arts','Other'];

export const TARGET_EXAMS = ['Board Exam','JEE Main','JEE Advanced','NEET','Other'];

export const MISTAKE_TYPES = ['Calculation','Concept','Question Reading','Formula','Language','Silly','Time Management','Other'];

export const SEVERITIES = ['Low','Medium','High'];

export const SEVERITY_COLORS = { Low:'#6bcb77', Medium:'#ffd93d', High:'#ff6b6b' };
