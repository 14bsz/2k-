/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubCardOption {
  name: string;      // e.g., "1 突（1 张）", "2 突 2 星（3 张）"
  subBaseCards: number; // e.g. 1, 3
  successRate: number;  // e.g. 48, 72 (as percentage out of 100)
}

export interface MainCardRule {
  level: string;        // e.g. "2突", "3突"
  mainBaseCards: number; // e.g. 2, 4
  targetLevel: string;  // e.g. "3突", "4突"
  targetBaseCards: number; // e.g. 4, 8
  subOptions: SubCardOption[];
}

export interface CombineRecord {
  id: string;                 // unique ID
  timestamp: string;          // ISO time string
  currentMainLevel: string;   // e.g., "3突"
  subCardType: string;        // e.g., "2突2星（3张）"
  successRate: number;        // e.g., 72
  result: boolean;            // true=成功, false=失败
  profit: number;             // profit value (integer, can be positive, negative, zero)
}

export interface AppState {
  initialCards: number;
  history: CombineRecord[];
  version: number;
}
