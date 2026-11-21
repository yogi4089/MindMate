export type SupportModeId = 'empathetic' | 'cbt' | 'grounding';

export type DistressLevel = 'none' | 'elevated' | 'crisis';

export interface SafetyAssessment {
  level: DistressLevel;
  matchedSignals: string[];
  recommendedAction: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modeId?: SupportModeId;
  safety?: SafetyAssessment;
}

export interface SupportMode {
  id: SupportModeId;
  name: string;
  shortLabel: string;
  summary: string;
  systemInstruction: string;
  starterPrompts: string[];
}
