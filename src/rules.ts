/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MainCardRule } from "./types";

export const COMBINE_RULES: MainCardRule[] = [
  {
    level: "2突",
    mainBaseCards: 2,
    targetLevel: "3突",
    targetBaseCards: 4,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 48 }
    ]
  },
  {
    level: "2突1星",
    mainBaseCards: 3,
    targetLevel: "3突",
    targetBaseCards: 4,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 72 }
    ]
  },
  {
    level: "3突",
    mainBaseCards: 4,
    targetLevel: "4突",
    targetBaseCards: 8,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 24 },
      { name: "2 突（2 张）", subBaseCards: 2, successRate: 48 },
      { name: "2 突 2 星（3 张）", subBaseCards: 3, successRate: 72 }
    ]
  },
  {
    level: "4突",
    mainBaseCards: 8,
    targetLevel: "5突",
    targetBaseCards: 16,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 12 },
      { name: "2 突（2 张）", subBaseCards: 2, successRate: 24 },
      { name: "2 突 2 星（3 张）", subBaseCards: 3, successRate: 36 },
      { name: "3 突（4 张）", subBaseCards: 4, successRate: 48 },
      { name: "3 突 1 星（5 张）", subBaseCards: 5, successRate: 60 },
      { name: "3 突 2 星（6 张）", subBaseCards: 6, successRate: 72 },
      { name: "3 突 3 星（7 张）", subBaseCards: 7, successRate: 84 }
    ]
  },
  {
    level: "5突",
    mainBaseCards: 16,
    targetLevel: "6突",
    targetBaseCards: 32,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 6 },
      { name: "2 突（2 张）", subBaseCards: 2, successRate: 12 },
      { name: "2 突 2 星（3 张）", subBaseCards: 3, successRate: 18 },
      { name: "3 突（4 张）", subBaseCards: 4, successRate: 24 },
      { name: "3 突 1 星（5 张）", subBaseCards: 5, successRate: 30 },
      { name: "3 突 2 星（6 张）", subBaseCards: 6, successRate: 36 },
      { name: "3 突 3 星（7 张）", subBaseCards: 7, successRate: 42 },
      { name: "4 突（8 张）", subBaseCards: 8, successRate: 48 },
      { name: "4 突带 1 张（9 张）", subBaseCards: 9, successRate: 54 },
      { name: "4 突 1 星（10 张）", subBaseCards: 10, successRate: 60 },
      { name: "4 突 1 星带 1 张（11 张）", subBaseCards: 11, successRate: 66 },
      { name: "4 突 2 星（12 张）", subBaseCards: 12, successRate: 72 },
      { name: "4 突 2 星带 1 张（13 张）", subBaseCards: 13, successRate: 78 },
      { name: "4 突 3 星（14 张）", subBaseCards: 14, successRate: 84 }
    ]
  },
  {
    level: "6突",
    mainBaseCards: 32,
    targetLevel: "7突",
    targetBaseCards: 64,
    subOptions: [
      { name: "1 突（1 张）", subBaseCards: 1, successRate: 3 },
      { name: "2 突（2 张）", subBaseCards: 2, successRate: 6 },
      { name: "2 突 2 星（3 张）", subBaseCards: 3, successRate: 9 },
      { name: "3 突（4 张）", subBaseCards: 4, successRate: 12 },
      { name: "3 突 1 星（5 张）", subBaseCards: 5, successRate: 15 },
      { name: "3 突 2 星（6 张）", subBaseCards: 6, successRate: 18 },
      { name: "3 突 3 星（7 张）", subBaseCards: 7, successRate: 21 },
      { name: "4 突（8 张）", subBaseCards: 8, successRate: 24 },
      { name: "4 突带 1 张（9 张）", subBaseCards: 9, successRate: 27 },
      { name: "4 突 1 星（10 张）", subBaseCards: 10, successRate: 30 },
      { name: "4 突 1 星带 1 张（11 张）", subBaseCards: 11, successRate: 33 },
      { name: "4 突 2 星（12 张）", subBaseCards: 12, successRate: 36 },
      { name: "4 突 2 星带 1 张（13 张）", subBaseCards: 13, successRate: 39 },
      { name: "4 突 3 星（14 张）", subBaseCards: 14, successRate: 42 },
      { name: "4 突 3 星带 1 张（15 张）", subBaseCards: 15, successRate: 45 },
      { name: "5 突（16 张）", subBaseCards: 16, successRate: 48 },
      { name: "5 突带 1 张（17 张）", subBaseCards: 17, successRate: 51 },
      { name: "5 突带 2 张（18 张）", subBaseCards: 18, successRate: 54 },
      { name: "5 突带 3 张（19 张）", subBaseCards: 19, successRate: 57 },
      { name: "5 突 1 星（20 张）", subBaseCards: 20, successRate: 60 },
      { name: "5 突 1 星带 1 张（21 张）", subBaseCards: 21, successRate: 63 },
      { name: "5 突 1 星带 2 张（22 张）", subBaseCards: 22, successRate: 66 },
      { name: "5 突 1 星带 3 张（23 张）", subBaseCards: 23, successRate: 69 },
      { name: "5 突 2 星（24 张）", subBaseCards: 24, successRate: 72 },
      { name: "5 突 2 星带 1 张（25 张）", subBaseCards: 25, successRate: 75 },
      { name: "5 突 2 星带 2 张（26 张）", subBaseCards: 26, successRate: 78 },
      { name: "5 突 2 星带 3 张（27 张）", subBaseCards: 27, successRate: 81 },
      { name: "5 突 3 星（28 张）", subBaseCards: 28, successRate: 84 },
      { name: "5 突 3 星带 1 张（29 张）", subBaseCards: 29, successRate: 87 },
      { name: "5 突 3 星带 2 张（30 张）", subBaseCards: 30, successRate: 90 },
      { name: "5 突 3 星带 3 张（31 张）", subBaseCards: 31, successRate: 93 }
    ]
  }
];
