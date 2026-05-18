import type { AnalysisResult } from "../lib/api";

export type RootStackParamList = {
  Main: undefined;
  Search: undefined;
  Results: { analysis: AnalysisResult };
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};
