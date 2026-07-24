
export enum CategoryType {
  PEOPLE = 'People',
  METHODS = 'Methods',
  MACHINES = 'Machines',
  MATERIALS = 'Materials',
  MEASUREMENTS = 'Measurements',
  ENVIRONMENT = 'Environment'
}

export type DomainFramework = 'software' | 'manufacturing' | 'service';

export interface CategoryInfo {
  name: string;
  description: string;
  icon: string;
  categories: string[];
}

export const FRAMEWORK_CATEGORIES: Record<DomainFramework, CategoryInfo> = {
  software: {
    name: 'Software Defect Analysis',
    description: 'Tailored for bugs, system crashes, API failures, memory leaks & performance bottlenecks',
    icon: 'fa-code',
    categories: [
      'Code & Logic',
      'Environment & Config',
      'Data & Storage',
      'Testing & QA',
      'Process & Workflow',
      'Integration & Dependencies'
    ]
  },
  manufacturing: {
    name: 'Traditional Manufacturing (6Ms)',
    description: 'Standard 6Ms for hardware, production lines, and physical operational root cause mapping',
    icon: 'fa-industry',
    categories: [
      'People',
      'Methods',
      'Machines',
      'Materials',
      'Measurements',
      'Environment'
    ]
  },
  service: {
    name: 'Service & Business Operations (6Ps)',
    description: 'Optimized for customer service delays, business operations, and organizational workflow defects',
    icon: 'fa-briefcase',
    categories: [
      'People',
      'Process',
      'Policies',
      'Platform & Tech',
      'Product',
      'Place'
    ]
  }
};

export enum AnalysisMethod {
  FISHBONE = 'fishbone',
  FIVE_WHYS = 'five_wh_ys',
  DELAY_PATH = 'delay_path'
}

export interface Cause {
  id: string;
  text: string;
  category: CategoryType | string | null;
  isWorkingOn?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DelayStep {
  id: string;
  label: string;
  duration: number; // in minutes/hours/days
  unit: string;
  description: string;
}

export interface FishboneData {
  problem: string;
  framework?: DomainFramework;
  causes: Cause[];
  checklist: ChecklistItem[];
}

export interface SuggestionResponse {
  suggestions: {
    category: string;
    reason: string;
  }[];
}

export interface SoftwareDefectTemplate {
  id: string;
  title: string;
  problem: string;
  framework: DomainFramework;
  badge: string;
  causes: { text: string; category: string }[];
  fiveWhys: string[];
  checklist: string[];
}

