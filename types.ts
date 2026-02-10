
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
  FIVE_WHYS = 'five_whys'
}

export interface Cause {
  id: string;
  text: string;
  category: CategoryType | null;
}

export interface FishboneData {
  problem: string;
  causes: Cause[];
}

export interface SuggestionResponse {
  suggestions: {
    category: CategoryType;
    reason: string;
  }[];
}
