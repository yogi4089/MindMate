import type { SafetyAssessment } from '../types';

export interface CrisisResource {
  name: string;
  contact: string;
  availability: string;
  region: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or text 988',
    availability: '24/7, free & confidential',
    region: 'United States & Canada',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    availability: '24/7 volunteer crisis counselors',
    region: 'US, UK, Canada, Ireland',
  },
  {
    name: 'International Helplines Directory',
    contact: 'findahelpline.com',
    availability: 'Verified local support in 130+ countries',
    region: 'Global',
  },
];

const CRISIS_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'suicidal ideation', regex: /\b(kill\s+myself|end\s+my\s+life|want\s+to\s+die|suicid(e|al)|better\s+off\s+dead|no\s+reason\s+to\s+live)\b/i },
  { label: 'self-harm intent', regex: /\b(hurt\s+myself|harm\s+myself|cut\s+myself|self[-\s]?harm|overdose)\b/i },
  { label: 'acute hopelessness', regex: /\b(can'?t\s+go\s+on|give\s+up\s+on\s+life|goodbye\s+forever)\b/i },
];

const ELEVATED_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'panic or overwhelm', regex: /\b(panic\s+attack|can'?t\s+breathe|spiraling|completely\s+overwhelmed|breaking\s+down)\b/i },
  { label: 'severe exhaustion', regex: /\b(hopeless|worthless|burned\s+out|exhausted\s+all\s+the\s+time|can'?t\s+cope)\b/i },
  { label: 'acute isolation', regex: /\b(nobody\s+cares|completely\s+alone|trapped)\b/i },
];

export function detectCrisisSignals(text: string): SafetyAssessment {
  const normalized = text.trim();
  if (!normalized) {
    return {
      level: 'none',
      matchedSignals: [],
      recommendedAction: 'Standard empathetic listening.',
    };
  }

  const crisisMatches: string[] = [];
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      crisisMatches.push(pattern.label);
    }
  }

  if (crisisMatches.length > 0) {
    return {
      level: 'crisis',
      matchedSignals: crisisMatches,
      recommendedAction:
        'Surface immediate crisis helpline numbers (988, 741741, findahelpline.com), validate pain gently, and encourage connecting with a trusted person or crisis counselor.',
    };
  }

  const elevatedMatches: string[] = [];
  for (const pattern of ELEVATED_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      elevatedMatches.push(pattern.label);
    }
  }

  if (elevatedMatches.length > 0) {
    return {
      level: 'elevated',
      matchedSignals: elevatedMatches,
      recommendedAction:
        'Prioritize calm validation, offer a gentle breathing or grounding pause, and avoid rushing to solutions.',
    };
  }

  return {
    level: 'none',
    matchedSignals: [],
    recommendedAction: 'Standard empathetic listening and open-ended reflection.',
  };
}
