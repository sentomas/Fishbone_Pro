
export enum CategoryType {
  PEOPLE = 'People',
  METHODS = 'Methods',
  MACHINES = 'Machines',
  MATERIALS = 'Materials',
  MEASUREMENTS = 'Measurements',
  ENVIRONMENT = 'Environment'
}

export enum AnalysisMethod {
  FISHBONE = 'fishbone',
  FIVE_WHYS = 'five_wh_ys',
  DELAY_PATH = 'delay_path'
}

export interface Cause {
  id: string;
  text: string;
  category: CategoryType | null;
  isWorkingOn?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DelayStep {
  id: string;
  description: string;
  duration: number;
  unit: 'mins' | 'hours' | 'days';
}

export interface FishboneData {
  problem: string;
  causes: Cause[];
  checklist: ChecklistItem[];
  delaySteps: DelayStep[];
}

export interface SuggestionResponse {
  suggestions: {
    category: CategoryType;
    reason: string;
  }[];
}
