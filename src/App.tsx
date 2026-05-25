/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  TrendingUp, 
  X, 
  Check, 
  CheckCircle, 
  XCircle, 
  Info, 
  Calendar, 
  AlertTriangle, 
  Layers, 
  History, 
  BarChart2,
  HelpCircle,
  Copy,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Brain
} from "lucide-react";
import { CombineRecord } from "./types";
import { COMBINE_RULES } from "./rules";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  // --- Persistent Storage ---
  const [initialCards, setInitialCards] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("nba2k_initial_cards");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [history, setHistory] = useState<CombineRecord[]>(() => {
    try {
      const stored = localStorage.getItem("nba2k_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("nba2k_initial_cards", initialCards.toString());
    } catch (e) {
      console.error("Failed to save initial cards", e);
    }
  }, [initialCards]);

  useEffect(() => {
    try {
      localStorage.setItem("nba2k_history", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  // --- Stop loss / Anti-tilt threshold ---
  const [stopLossPercent, setStopLossPercent] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("nba2k_stop_loss_percent");
      return stored ? parseInt(stored, 10) : 30; // default to 30% Stop loss warning
    } catch {
      return 30;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("nba2k_stop_loss_percent", stopLossPercent.toString());
    } catch (e) {
      console.error("Failed to save stop loss", e);
    }
  }, [stopLossPercent]);

  // --- Form & Selections ---
  const [selectedMainLevel, setSelectedMainLevel] = useState<string>("3突");
  const [selectedSubCardName, setSelectedSubCardName] = useState<string>("");

  // Keep track of current total card count
  const currentTotal = useMemo(() => {
    const profitSum = history.reduce((sum, item) => sum + item.profit, 0);
    return initialCards + profitSum;
  }, [initialCards, history]);

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warning" | "error" | "info">("info");
  
  const triggerToast = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Warn if total cards turns negative
  useEffect(() => {
    if (currentTotal < 0) {
      triggerToast("当前总卡量为负，请核对初始卡量或历史记录", "warning");
    }
  }, [currentTotal]);

  // Find sub-options based on select primary level
  const activeRule = useMemo(() => {
    return COMBINE_RULES.find(rule => rule.level === selectedMainLevel);
  }, [selectedMainLevel]);

  // Set default subcard option when main card level changes
  useEffect(() => {
    if (activeRule && activeRule.subOptions.length > 0) {
      setSelectedSubCardName(activeRule.subOptions[0].name);
    } else {
      setSelectedSubCardName("");
    }
  }, [selectedMainLevel, activeRule]);

  // Find currently selected subcard config
  const activeSubOption = useMemo(() => {
    if (!activeRule) return null;
    return activeRule.subOptions.find(opt => opt.name === selectedSubCardName) || null;
  }, [activeRule, selectedSubCardName]);

  // Calculate potential profit/loss dynamically
  const expectedProfitDetail = useMemo(() => {
    if (!activeRule || !activeSubOption) return { success: 0, failure: 0 };
    const M = activeRule.mainBaseCards;
    const S = activeSubOption.subBaseCards;
    return {
      success: M - S, // e.g. 4 - 1 = 3 (Main base cards minus sub base cards)
      failure: -S     // e.g. -1 (Main is kept on failure, only sub card is lost)
    };
  }, [activeRule, activeSubOption]);

  // Button disabled state for double-click prevention
  const [btnDisabled, setBtnDisabled] = useState(false);

  // --- 理智安全卫士拦截弹窗状态 ---
  const [triggeredAlerts, setTriggeredAlerts] = useState<{
    stopLossBreached: boolean;
    tiltEventTimestamp: string | null;
    lastCriticalScoreAlert: number | null;
  }>({
    stopLossBreached: false,
    tiltEventTimestamp: null,
    lastCriticalScoreAlert: null
  });

  const [antiTiltModalConfig, setAntiTiltModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    type: "stop_loss" | "tilt_event" | "critical_score";
    score: number;
    message: string;
    advice: string;
  } | null>(null);

  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [hasShownAlertInSession, setHasShownAlertInSession] = useState(false);

  // Initial Card Setup Dialog
  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState(false);
  const [tempInitialInput, setTempInitialInput] = useState<string>(initialCards.toString());
  const [isInitialConfirmationOpen, setIsInitialConfirmationOpen] = useState(false);

  // Delete Confirmation Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Clear All Confirmation Dialog
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Help info state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExpectedAvgHelpOpen, setIsExpectedAvgHelpOpen] = useState(false);
  const [isStopLossHelpOpen, setIsStopLossHelpOpen] = useState(false);

  // Right Column Tab Selection state to make the layout extremely compact
  const [rightPanelTab, setRightPanelTab] = useState<"stats" | "sentry">("stats");

  // Detail collapse states to reduce screen clutter
  const [isTiltDetailExpanded, setIsTiltDetailExpanded] = useState(false);

  // --- Handlers ---
  const handleOpenInitialSetup = () => {
    setTempInitialInput(initialCards.toString());
    setIsInitialSetupOpen(true);
    setIsInitialConfirmationOpen(false);
  };

  const handleSaveInitialCards = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tempInitialInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      triggerToast("请输入有效的正整数初始卡量", "error");
      return;
    }

    if (history.length > 0) {
      // Show custom react double confirmation popup instead of window.confirm which is blocked in sandbox iframes
      setIsInitialConfirmationOpen(true);
    } else {
      setInitialCards(parsed);
      setIsInitialSetupOpen(false);
      triggerToast(`初始卡量已成功设置为 ${parsed} 张`, "success");
    }
  };

  const handleConfirmSaveInitialCards = () => {
    const parsed = parseInt(tempInitialInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      triggerToast("请输入有效的正整数初始卡量", "error");
      return;
    }
    setInitialCards(parsed);
    setIsInitialConfirmationOpen(false);
    setIsInitialSetupOpen(false);
    triggerToast(`初始卡量已成功设置为 ${parsed} 张`, "success");
  };

  // Add combine result record
  const handleAddRecord = (result: boolean) => {
    if (!activeRule || !activeSubOption) {
      triggerToast("暂不支持该合卡类型", "error");
      return;
    }

    if (btnDisabled) return;
    setBtnDisabled(true);
    setTimeout(() => setBtnDisabled(false), 500); // 0.5s debounce

    // Short tactile vibration if supported
    try {
      if (navigator.vibrate) {
        navigator.vibrate(result ? [50, 30, 50] : [100]);
      }
    } catch {}

    const profit = result ? expectedProfitDetail.success : expectedProfitDetail.failure;

    const newRecord: CombineRecord = {
      id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      currentMainLevel: selectedMainLevel,
      subCardType: selectedSubCardName,
      successRate: activeSubOption.successRate,
      result: result,
      profit: profit
    };

    setHistory(prev => [newRecord, ...prev]);
    
    if (result) {
      triggerToast(`记录成功: +${profit} 张1突卡`, "success");
    } else {
      triggerToast(`记录失败: ${profit} 张1突卡`, "error");
    }
  };

  // Deletion helper
  const handleDeleteRecord = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    setDeleteConfirmId(null);
    triggerToast("记录已删除，系统已重算实时账本", "info");
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    setIsClearAllConfirmOpen(false);
    triggerToast("所有合卡结果已清空，卡量恢复至初始状态", "success");
  };

  // --- Statistics helper variables ---
  const stats = useMemo(() => {
    const totalCount = history.length;
    if (totalCount === 0) {
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        expectedSuccessAvg: 0,
        luckFactor: "平稳", // Luck indicator
        netProfit: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        currentStreak: 0,
        currentStreakType: "win" as "win" | "loss" | "none",
        breakthroughCounts: {} as Record<string, { total: number; success: number }>
      };
    }

    let successCount = 0;
    let failureCount = 0;
    let expectedSum = 0;
    let netProfit = 0;

    // Streaks tracking
    let currentStreakCount = 0;
    let currentStreakType: "win" | "loss" | "none" = "none";
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    // Breakthrough distributions
    const breakthroughCounts: Record<string, { total: number; success: number }> = {};

    // History is newest first, so reverse to calculate streaks sequentially
    const sequentialHistory = [...history].reverse();

    sequentialHistory.forEach((item, index) => {
      netProfit += item.profit;
      expectedSum += item.successRate / 100;

      // Classify distribution
      const mainLevelKey = item.currentMainLevel;
      if (!breakthroughCounts[mainLevelKey]) {
        breakthroughCounts[mainLevelKey] = { total: 0, success: 0 };
      }
      breakthroughCounts[mainLevelKey].total += 1;

      if (item.result) {
        successCount++;
        breakthroughCounts[mainLevelKey].success += 1;

        // Streak check
        if (currentStreakType === "win") {
          currentStreakCount++;
        } else {
          currentStreakType = "win";
          currentStreakCount = 1;
        }
        if (currentStreakCount > maxWinStreak) maxWinStreak = currentStreakCount;
      } else {
        failureCount++;
        
        // Streak check
        if (currentStreakType === "loss") {
          currentStreakCount++;
        } else {
          currentStreakType = "loss";
          currentStreakCount = 1;
        }
        if (currentStreakCount > maxLossStreak) maxLossStreak = currentStreakCount;
      }
    });

    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    const expectedSuccessAvg = totalCount > 0 ? (expectedSum / totalCount) * 100 : 0;
    
    // Evaluate Luck Index
    const diff = successRate - expectedSuccessAvg;
    let luckFactor = "平稳运转";
    if (diff > 15) luckFactor = "运势爆棚 ⭐⭐⭐";
    else if (diff > 5) luckFactor = "手气极佳 ⭐⭐";
    else if (diff > -5) luckFactor = "符合概率 ⭐";
    else if (diff > -15) luckFactor = "手气欠佳 🌀";
    else luckFactor = "手气极差 🌧️";

    // Re-check streak for current (newest) record
    let finalStreakCount = 0;
    let finalStreakType: "win" | "loss" | "none" = "none";
    if (history.length > 0) {
      const firstResult = history[0].result;
      finalStreakType = firstResult ? "win" : "loss";
      for (const item of history) {
        if (item.result === firstResult) {
          finalStreakCount++;
        } else {
          break;
        }
      }
    }

    return {
      total: totalCount,
      successCount,
      failureCount,
      successRate: Math.round(successRate * 10) / 10,
      expectedSuccessAvg: Math.round(expectedSuccessAvg * 10) / 10,
      luckFactor,
      netProfit,
      maxWinStreak,
      maxLossStreak,
      currentStreak: finalStreakCount,
      currentStreakType: finalStreakType,
      breakthroughCounts
    };
  }, [history]);

  // --- Sanity / Anti-tilt Stop Loss Sentry stats ---
  const sanityStats = useMemo(() => {
    // 1. Calculate Sanity Score [0 - 100] intelligently based on both active stopLossPercent AND absolute card counts
    const netProfit = stats.netProfit;
    const lossStreak = stats.currentStreakType === "loss" ? stats.currentStreak : 0;
    
    let baseScore = 100;
    let lossPercent = 0;
    
    // Determine the specific defensive multiplier/sensitivity coefficients based on active stopLossPercent
    // This makes the stop loss line selection behave VERY differently!
    let scoreSensitivity = 1.0;
    let profileName = "🌟 黄金平衡风控 (推荐 30%)";
    let activePhilosophy = "平和对冲波动与黑天鹅的平衡模型";
    if (stopLossPercent === 15) {
      scoreSensitivity = 1.5; // High sensitivity: small losses trigger alarm quickly
      profileName = "🛡️ 保守严格保本 (15%)";
      activePhilosophy = "绝对严苛的风控，对任何回撤零容忍";
    } else if (stopLossPercent === 30) {
      scoreSensitivity = 1.0; // Standard golden multiplier
      profileName = "🌟 黄金平衡风控 (30%)";
      activePhilosophy = "给概率短期回撤留有空间，防范大炸";
    } else if (stopLossPercent === 45) {
      scoreSensitivity = 0.7; // Lower sensitivity: gives room for big swings
      profileName = "⚡ 激进大数对冲 (45%)";
      activePhilosophy = "适合抗压能力极强，追求极限复合高价值的玩家";
    } else if (stopLossPercent === 60) {
      scoreSensitivity = 0.4; // Extremely dull reaction, only flags when basically ruined
      profileName = "🚨 狂暴濒危熔断 (60%)";
      activePhilosophy = "高度危险的钢丝流，极度逼近全损爆仓线";
    }

    if (netProfit < 0 && initialCards > 0) {
      lossPercent = Math.round((Math.abs(netProfit) / initialCards) * 100);
      
      // Compute progress toward user's custom stop-loss limit
      const allowedLossCount = initialCards * (stopLossPercent / 100);
      const drawdownProgress = Math.abs(netProfit) / Math.max(1, allowedLossCount);
      
      // base score smoothly decays towards 0 as we approach stop loss, weighted by scoreSensitivity
      baseScore = Math.round((1 - Math.min(1, drawdownProgress * scoreSensitivity)) * 100);
    }
    
    // Deduct for loss streaks moderately rather than extremely aggressively, also scaled by sensitivity
    const streakDeduction = lossStreak > 1 ? (lossStreak - 1) * 6 * scoreSensitivity : 0;
    
    let score = baseScore - Math.round(streakDeduction);

    // Look for high-risk tilt event: high-tier high-probability failure in the last 3 matches in history
    let tiltWarningEvent = null;
    const recentItems = history.slice(0, 3);
    for (const item of recentItems) {
      // Check if currentMainLevel is 5突 or 6突 (high value upgrades) or success rate was high
      const isHighTier = item.currentMainLevel === "5突" || item.currentMainLevel === "6突";
      const isHighProbability = item.successRate >= 48; // e.g. 48%, 60%, 72% success rate
      if (item.result === false && isHighTier && isHighProbability) {
        tiltWarningEvent = {
          mainLevel: item.currentMainLevel,
          subCard: item.subCardType,
          successRate: item.successRate,
          timestamp: item.timestamp,
        };
        break; // Stop at first matched high-tier failure
      }
    }

    // Deduct additional score if they just suffered a devastating high-tier blast (major tilt risk)
    if (tiltWarningEvent) {
      score -= 28; // Large penalty due to the extreme risk of impulsive market buying (revenge combination)
    }

    // CAPITAL ABUNDANCE SAFEGUARD: If they still have massive absolute cards left, they have massive buffer capacity!
    // In NBA2KOL2, a standard highest craft cost (e.g. 3突/4突) uses 4 to 12 cards.
    // If they have 32+ cards left, they can comfortably afford many consecutive full attempts!
    if (currentTotal >= 32) {
      score += 35; // Absolute luxury cushion
    } else if (currentTotal >= 20) {
      score += 20; // Very substantial cushion
    } else if (currentTotal >= 12) {
      score += 10; // Moderate comfortable cushion
    } else if (currentTotal < 6 && currentTotal > 3) {
      score -= 15; // Low capital buffer penalty
    } else if (currentTotal <= 3) {
      score -= 30; // Direct bankruptcy penalty
    }

    // Ensure score bounds are correct. If in net loss, cap at 95 to retain a yellow/green indicator rather than fully perfect green.
    if (netProfit < 0) {
      score = Math.max(0, Math.min(95, score));
    } else {
      score = Math.max(0, Math.min(100, score));
    }
    
    // 2. Map risk state profiles based on our smart score
    let statusText = "🟢 绿灯・心态理智冷静";
    let advice = "当前各项指标良好，盈亏处于科学合理的规律周期内。保持清醒，稳健合卡！";
    let colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let barColor = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
    
    if (score < 20) {
      statusText = "🔴 红灯・理智触底 / 强烈建议止损";
      advice = `⚠️ 警告！根据博弈测算，您当前累计损耗已高度贴近或跌破您所设定的 ${stopLossPercent}% 止损线，当前残存本金过于单薄（仅剩 ${currentTotal} 张）。不可强求连击，建议立即修整！`;
      colorClass = "text-red-400 bg-red-400/10 border-red-500/20";
      barColor = "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse";
    } else if (score < 50) {
      statusText = "🟠 橙灯・警戒升高 / 需防连续黑天鹅";
      advice = `当前回撤已消耗大部分容错额度。虽然您目前拥有 ${currentTotal} 张卡，绝对卡量仍能支持，但容错率正在慢慢收窄，千万不可狂暴追投或陷入“高本金一把梭哈”的心态陷阱。`;
      colorClass = "text-orange-400 bg-orange-500/10 border-orange-500/20";
      barColor = "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]";
    } else if (score < 80) {
      statusText = "🟡 黄灯・状态平稳 / 建议温和合卡";
      advice = `近期手气虽稍有波动，但您手头持卡量绝对值依然非常厚实（当前本金 ${currentTotal} 张），具有绝佳的抗方差震荡抗性。建议控制节奏，细水长流。`;
      colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      barColor = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
    }
    
    // Explicitly update descriptions based on stop-loss lines
    if (stopLossPercent === 15 && score < 80 && score >= 50) {
      advice = `⚠️ 注意：在最高敏感度的【15% 保守拦截】机制下，任何微弱变动都会触发黄灯警示！虽然手头持卡量（${currentTotal} 张）仍十分充足，但系统判定此时是保守型风控的边缘，请注意合规防震荡。`;
    } else if (stopLossPercent === 60 && score < 50) {
      advice = `‼️ 危险高能！您当前处于【60% 狂暴止损】极限红线上！此条线只在你已经耗尽了 60% 绝大多数初始储备时报警。此时爆头风险超等严重，不要自恃还有少量本金而继续狂奔！`;
    }

    // 3. Mathematical probability of complete recovery (Ruin equation estimation)
    const recoveryProbability = initialCards > 0
      ? Math.max(0, Math.min(100, Math.round((currentTotal / initialCards) * 100)))
      : 100;

    // 4. Stop-loss criteria check
    let lossPercentValue = 0;
    if (netProfit < 0 && initialCards > 0) {
      lossPercentValue = Math.round((Math.abs(netProfit) / initialCards) * 100);
    }
    const isStopLossBreached = netProfit < 0 && lossPercentValue >= stopLossPercent;

    return {
      score,
      statusText,
      advice,
      colorClass,
      barColor,
      recoveryProbability,
      lossPercent: lossPercentValue,
      isStopLossBreached,
      tiltWarningEvent, // returned so we can display beautiful alert
      profileName,
      activePhilosophy,
      scoreSensitivity
    };
  }, [stats, initialCards, currentTotal, stopLossPercent, history]);

  // Auto-switch to "Sentry" tab if stop-loss is breached or sanity is in critical warning zones
  useEffect(() => {
    if (sanityStats.isStopLossBreached || sanityStats.score < 50) {
      setRightPanelTab("sentry");
    }
  }, [sanityStats.isStopLossBreached, sanityStats.score]);

  // Anti-tilt modal countdown timer
  useEffect(() => {
    let interval: any;
    if (antiTiltModalConfig?.isOpen && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds(p => p - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [antiTiltModalConfig?.isOpen, countdownSeconds]);

  // Trigger Anti-tilt Popup Modals based on critical thresholds
  const alertStopLoss = triggeredAlerts.stopLossBreached;
  const alertTiltTS = triggeredAlerts.tiltEventTimestamp;
  const alertScore = triggeredAlerts.lastCriticalScoreAlert;
  const isAntiTiltOpen = antiTiltModalConfig?.isOpen || false;
  const tiltTS = sanityStats.tiltWarningEvent?.timestamp || null;
  const historyLen = history.length;

  useEffect(() => {
    if (historyLen === 0) {
      if (alertStopLoss || alertTiltTS !== null || alertScore !== null || hasShownAlertInSession) {
        setTriggeredAlerts({
          stopLossBreached: false,
          tiltEventTimestamp: null,
          lastCriticalScoreAlert: null
        });
        setHasShownAlertInSession(false);
      }
      return;
    }

    if (hasShownAlertInSession || isAntiTiltOpen) {
      return;
    }

    const score = sanityStats.score;

    // 1. TRIGGER: STOP LOSS RECENT BREACH
    if (sanityStats.isStopLossBreached && !alertStopLoss) {
      setTriggeredAlerts(prev => ({ ...prev, stopLossBreached: true }));
      setCountdownSeconds(4); // 4-second delay to calm down
      setAntiTiltModalConfig({
        isOpen: true,
        title: "🚨 资金防线失守・触发强制止损 🚨",
        type: "stop_loss",
        score: score,
        message: `您当前累计净损耗已达 ${sanityStats.lossPercent}% 初始资金（当前剩余本金 ${currentTotal} 张卡），正式穿透了您预设的 ${stopLossPercent}% 防守境界线！`,
        advice: "「冷知识」在大胜率爆仓后追加豪赌，是 98% 的玩家赔光筹码的罪魁祸首。理智安全护盾已自动截停！建议喝一杯水，离开模拟环境，做个一分钟的心情重构。"
      });
      return;
    }

    // 2. TRIGGER: DEVASTATING TILT BLACK SWAN
    if (sanityStats.tiltWarningEvent) {
      const ts = sanityStats.tiltWarningEvent.timestamp;
      if (alertTiltTS !== ts) {
        setTriggeredAlerts(prev => ({ ...prev, tiltEventTimestamp: ts }));
        setCountdownSeconds(3); // 3-second recovery delay
        setAntiTiltModalConfig({
          isOpen: true,
          title: "🧠 黑天鹅爆卡・心态防震警告 🧠",
          type: "tilt_event",
          score: score,
          message: `监测到您刚刚在 [${sanityStats.tiltWarningEvent.mainLevel}] 高价值突破中，副卡配方 (${sanityStats.tiltWarningEvent.subCard}) 发生爆卡（主卡期望胜率高达 ${sanityStats.tiltWarningEvent.successRate}%）。`,
          advice: "遭遇统计学上的“小概率失败”极易诱发急躁和报复性追加（赌徒心理：总觉得下一把绝对能成）。这往往是仓位毁灭的开端。请闭眼平心静气，系统已自动施安心态锁。"
        });
        return;
      }
    }

    // 3. TRIGGER: CRITICAL SCORE FALLS
    if (score < 20 && alertScore !== 20) {
      setTriggeredAlerts(prev => ({ ...prev, lastCriticalScoreAlert: 20 }));
      setCountdownSeconds(4);
      setAntiTiltModalConfig({
        isOpen: true,
        title: "🔴 心态评分极低危・理智红牌 🔴",
        type: "critical_score",
        score: score,
        message: `您的「理智综合评分」已降至 ${score} 分极度深渊！当前持卡已经高度濒危（仅剩 ${currentTotal} 张卡），面临破产翻车大劫！`,
        advice: "卡储备极低时合卡冲动极易导致财富迅速清零。系统强制弹窗劝停！请点击确定平息情绪，签署不服输理智誓言：绝不随意融掉其他大突主力球员追加赌资！"
      });
      return;
    } else if (score < 50 && score >= 20 && alertScore !== 50 && alertScore !== 20) {
      setTriggeredAlerts(prev => ({ ...prev, lastCriticalScoreAlert: 50 }));
      setCountdownSeconds(3);
      setAntiTiltModalConfig({
        isOpen: true,
        title: "🟠 心态评分下降・黄牌警戒 🟠",
        type: "critical_score",
        score: score,
        message: `由于近期爆卡或起跑资金遭受侵蚀，您的综合理智评分已低于警戒线 (${score} 分)。`,
        advice: "心态温升中，赌博大脑易蒙蔽客观概率。强制弹窗温和拦截：建议适当放缓合卡节奏，改变底子，或者到『理智安全卫士』模块中深呼吸舒展情绪。"
      });
      return;
    }
  }, [historyLen, sanityStats.isStopLossBreached, tiltTS, sanityStats.score, currentTotal, stopLossPercent, alertStopLoss, alertTiltTS, alertScore, hasShownAlertInSession, isAntiTiltOpen]);

  // Sparkline data coordinates based on total cards trend over time
  const sparklinePoints = useMemo(() => {
    if (history.length === 0) return "";
    
    // We want chronologically ordered points starting from initialCards
    // Let's compute the value of each step
    const values: number[] = [initialCards];
    let runningVal = initialCards;
    
    // Sequential history (oldest first)
    const sequential = [...history].reverse();
    sequential.forEach(item => {
      runningVal += item.profit;
      values.push(runningVal);
    });

    const minVal = Math.min(...values, 0); // floor to at least 0 for visualization
    const maxVal = Math.max(...values, 10); // ceiling to at least 10
    const valRange = maxVal - minVal || 1;

    const width = 450;
    const height = 90;
    const padding = 8;

    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / valRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");

    return points;
  }, [history, initialCards]);

  // Latest symbol series representation of combinations (last 32 results) for trend overview; showing newest first (latest on the left/front)
  const symbolsSeries = useMemo(() => {
    return history.slice(0, 32).map(item => ({
      id: item.id,
      result: item.result,
      level: item.currentMainLevel,
      profit: item.profit
    }));
  }, [history]);

  // Preset Fast-Buttons for popular operations requested by players
  const quickPresets = [
    { main: "2突", sub: "1 突（1 张）", label: "2+1 (48% 胜率)" },
    { main: "3突", sub: "1 突（1 张）", label: "3+1 (24% 胜率)" },
    { main: "3突", sub: "2 突 2 星（3 张）", label: "3+2 突2星 (72% 胜率)" }
  ];

  const handleApplyPreset = (main: string, sub: string) => {
    setSelectedMainLevel(main);
    setSelectedSubCardName(sub);
    triggerToast(`已快速配装: ${main} + ${sub}`, "info");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950 font-sans">
      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border pointer-events-auto ${
              toastType === "success" ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 success-glow" :
              toastType === "error" ? "bg-red-950/90 border-red-500/40 text-red-100 fail-glow" :
              toastType === "warning" ? "bg-amber-950/90 border-amber-500/40 text-amber-100" :
              "bg-slate-900/95 border-slate-700 text-slate-100"
            }`}>
              {toastType === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toastType === "error" && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {toastType === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {toastType === "info" && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg flex items-center justify-center font-display font-extrabold text-slate-950 text-base shadow-lg shadow-orange-500/20">
              2K
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
                NBA2KOL2 合卡盈亏记录器
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Card breakthrough simulation ledger</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              title="计价与规则说明"
              id="btn-help-rule"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              本地云账本就绪
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Record Input and Dynamic Cards Dashboard (7 Cols) - Sticky implementation for easy scrolling tracking */}
        <section className="lg:col-span-7 lg:sticky lg:top-[80px] lg:self-start space-y-6 flex flex-col">
          
          {/* Dashboard Hero Banner Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[170px]">
            {/* Visual ambient accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -ml-6 -mb-6 pointer-events-none"></div>

            <div className="flex items-start justify-between z-10">
              <div>
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  当前总卡量 (换算为 1突卡)
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-display transition-colors ${
                    currentTotal < 0 ? "text-red-400" : "text-amber-400"
                  }`} id="txt-current-total">
                    {currentTotal.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">张</span>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={handleOpenInitialSetup}
                className="py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 hover:text-white text-slate-300 rounded-lg text-xs font-medium border border-slate-700/50 flex items-center gap-1.5 transition-all shadow-sm"
                id="btn-edit-initial"
              >
                <Edit3 className="w-3.5 h-3.5" />
                设置初始
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-900 mt-4 z-10 text-xs text-slate-400">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 flex flex-col justify-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase font-mono tracking-wider leading-none">初始本金</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-200 mt-1.5 flex items-baseline leading-none font-display">
                  {initialCards}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">张</span>
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 px-3.5 rounded-xl border border-slate-800/80 shadow-lg col-span-1 scale-105 origin-center ring-1 ring-amber-500/15 flex flex-col justify-center">
                <p className="text-amber-500 text-[10px] uppercase font-mono font-bold tracking-wider leading-none">累计盈亏</p>
                <p className={`text-lg sm:text-2xl font-black mt-1.5 flex items-baseline leading-none font-display ${
                  stats.netProfit > 0 ? "text-emerald-400" : stats.netProfit < 0 ? "text-red-400" : "text-slate-400"
                }`}>
                  <span className="text-sm font-medium mr-0.5">{stats.netProfit > 0 ? "+" : ""}</span>
                  {stats.netProfit}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">张</span>
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 flex flex-col justify-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase font-mono tracking-wider leading-none">合卡战绩</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-200 mt-1.5 flex items-baseline leading-none font-display">
                  <span className="text-emerald-400">{stats.successCount}</span>
                  <span className="text-[10px] text-slate-500 font-normal mx-0.5 font-sans">胜</span>
                  <span className="text-slate-700 text-xs mx-1">/</span>
                  <span className="text-red-400">{stats.failureCount}</span>
                  <span className="text-[10px] text-slate-500 font-normal mx-0.5 font-sans">败</span>
                </p>
              </div>
            </div>
          </div>

          {/* Core Recording Control Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="font-semibold font-display tracking-tight text-white flex items-center gap-2">
                <span>新增单次合卡结果</span>
              </h2>
              <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded font-mono">
                Formula Engine v1.0
              </span>
            </div>

            {/* Quick Presets Section */}
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-medium">推荐极速预设 (一键套用)：</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {quickPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplyPreset(preset.main, preset.sub)}
                    className="py-2 px-2.5 bg-slate-950 hover:bg-slate-800 text-left rounded-xl border border-slate-800 text-[11px] text-slate-300 font-medium hover:border-slate-700/85 transition-all outline-none"
                  >
                    <div className="text-slate-400 text-[9px] font-semibold tracking-wider font-mono uppercase mb-0.5">Preset {index+1}</div>
                    <div className="font-bold text-slate-200">{preset.main}+{preset.sub.split("（")[0]}</div>
                    <div className="text-amber-500 font-mono scale-95 origin-left">{preset.label.split(" (")[1]?.replace(")", "")} 概率</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Pickers row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Picker A: Main Card Level */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span>选择主卡等级 :</span>
                  <span className="text-slate-500">(即目标突破等级)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedMainLevel}
                    onChange={(e) => setSelectedMainLevel(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-semibold appearance-none"
                    id="select-main-level"
                  >
                    {COMBINE_RULES.map((rule) => (
                      <option key={rule.level} value={rule.level}>
                        {rule.level} (相当于 {rule.mainBaseCards}张 1突卡)
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Picker B: Sub Card Option */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span>选择副卡消耗类型 :</span>
                  <span className="text-slate-500">(关联成功概率)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSubCardName}
                    onChange={(e) => setSelectedSubCardName(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-medium appearance-none"
                    id="select-sub-card"
                  >
                    {activeRule?.subOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

            </div>

            {/* Live Formula Simulation Feedback Output */}
            {activeRule && activeSubOption && (
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-semibold">合卡规则预测分析:</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    主卡值: {activeRule.mainBaseCards}张 / 副卡值: {activeSubOption.subBaseCards}张
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  
                  {/* Metric 1: Rate */}
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">官方合成概率</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-bold font-display text-white">{activeSubOption.successRate}%</span>
                    </div>
                  </div>

                  {/* Metric 2: Success potential */}
                  <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/10 flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-500 font-medium">成功预期 (若 ✓)</span>
                    <div className="flex items-baseline gap-1 mt-1 text-emerald-400 font-bold font-display text-xl">
                      <span>+{expectedProfitDetail.success}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">张</span>
                    </div>
                  </div>

                  {/* Metric 3: Failure cost */}
                  <div className="bg-red-950/20 p-2.5 rounded-lg border border-red-500/10 flex flex-col justify-between">
                    <span className="text-[10px] text-red-500 font-medium">失败预期 (若 ✗)</span>
                    <div className="flex items-baseline gap-1 mt-1 text-red-400 font-bold font-display text-xl">
                      <span>{expectedProfitDetail.failure}</span>
                      <span className="text-[10px] text-red-600 font-medium">张</span>
                    </div>
                  </div>

                </div>

                {/* Mathematical formula explanation */}
                <div className="text-[10px] text-slate-500 font-mono leading-relaxed bg-slate-900/30 p-2 rounded-lg border border-slate-900">
                  ⚠️ 统一公式：成功赚 = 主卡本体 {activeRule.mainBaseCards}张 − 副卡 {activeSubOption.subBaseCards}张 = {expectedProfitDetail.success}张；失败亏 = 消耗副卡 {activeSubOption.subBaseCards}张 = {expectedProfitDetail.failure}张 (主卡保留)。
                </div>
              </div>
            )}

            {/* HUGE BUTTONS FOR ACTION RECORD */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              
              {/* Success Button */}
              <button
                disabled={btnDisabled}
                onClick={() => handleAddRecord(true)}
                className={`group py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl font-bold font-display text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer`}
                id="btn-record-success"
              >
                <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                成功 (✓)
              </button>

              {/* Failure Button */}
              <button
                disabled={btnDisabled}
                onClick={() => handleAddRecord(false)}
                className={`group py-4 px-6 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl font-bold font-display text-base shadow-lg shadow-red-500/20 flex items-center justify-center gap-2.5 transition-all outline-none cursor-pointer`}
                id="btn-record-fail"
              >
                <X className="w-5 h-5 group-hover:scale-125 transition-transform" />
                失败 (✗)
              </button>

            </div>

          </div>

          {/* Sparkline historical trend chart viz */}
          {history.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  卡量盈亏变动趋势 (历史测深图)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  最近 {history.length + 1} 个点
                </span>
              </div>
              
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 overflow-hidden">
                <svg 
                  viewBox="0 0 450 100" 
                  className="w-full h-auto overflow-visible select-none"
                  style={{ maxHeight: "110px" }}
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid guide lines */}
                  <line x1="0" y1="10" x2="450" y2="10" stroke="#1e293b" strokeDasharray="3 3"/>
                  <line x1="0" y1="50" x2="450" y2="50" stroke="#1e293b" strokeDasharray="3 3"/>
                  <line x1="0" y1="90" x2="450" y2="90" stroke="#1e293b" strokeDasharray="3 3"/>

                  {/* Sparkline Area fill */}
                  {sparklinePoints && (
                    <polygon 
                      points={`${sparklinePoints.split(" ").slice(0, 1)[0].split(",")[0]},92 ${sparklinePoints} ${sparklinePoints.split(" ").slice(-1)[0].split(",")[0]},92`}
                      fill="url(#chartGradient)"
                    />
                  )}

                  {/* Sparkline Path */}
                  {sparklinePoints && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparklinePoints}
                    />
                  )}

                  {/* Dots for step points if the history is short */}
                  {history.length < 25 && sparklinePoints && sparklinePoints.split(" ").map((pt, idx) => {
                    const [x, y] = pt.split(",");
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#f59e0b"
                        stroke="#0a0f1d"
                        strokeWidth="1.5"
                        className="hover:r-5 cursor-pointer"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 mt-2 font-mono">
                <span>初始本金 ({initialCards})</span>
                <span>当前卡数 ({currentTotal})</span>
              </div>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: Ledger history and statistics (5 Cols) */}
        <section className="lg:col-span-5 space-y-6 flex flex-col">

          {/* Unified Analytics and Sentry Hub Container (Compacted with Tabs) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Elegant Selector Tabs Header with indicator */}
            <div className="flex border-b border-slate-800 bg-slate-950/45 p-1.5 gap-1.5 select-none shrink-0">
              <button
                onClick={() => setRightPanelTab("stats")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold font-sans text-xs sm:text-sm transition-all cursor-pointer ${
                  rightPanelTab === "stats"
                    ? "bg-slate-900 text-amber-500 border border-slate-800/60 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
                type="button"
                id="tab-btn-stats"
              >
                <BarChart2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>走势概率星盘</span>
              </button>

              <button
                onClick={() => setRightPanelTab("sentry")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold font-sans text-xs sm:text-sm transition-all relative cursor-pointer ${
                  rightPanelTab === "sentry"
                    ? "bg-slate-900 text-rose-400 border border-slate-800/60 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
                type="button"
                id="tab-btn-sentry"
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 ${sanityStats.isStopLossBreached ? "text-rose-500 animate-pulse" : "text-rose-450"}`} />
                <span>理智卫士盾防</span>
                {sanityStats.isStopLossBreached && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute right-3 top-3.5" />
                )}
              </button>
            </div>

            {/* Content Hub panel body - padded */}
            <div className="p-4 sm:p-5 space-y-4">
              {rightPanelTab === "stats" ? (
                // --- TAB 1: QUICK STATS BOARD ---
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                    <h3 className="text-xs font-bold font-display text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-amber-500" />
                      合卡走势概率观测仪
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Real-time Statistics
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs leading-relaxed">
                      暂无历史账单。开始合卡操作后，概率星盘会自动激活 📈
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Visual Streak Gauge */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-mono">近期运气评价</span>
                          <span className="text-xs font-bold text-slate-200 mt-0.5 inline-block">{stats.luckFactor}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-mono">当前连击</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            stats.currentStreakType === "win" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {stats.currentStreakType === "win" ? "连胜" : "连败"} {stats.currentStreak} 代
                          </span>
                        </div>
                      </div>

                      {/* Key percentages ratios */}
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block font-mono">实际合成胜率</span>
                          <span className="text-base font-bold text-emerald-400 block mt-1">{stats.successRate}%</span>
                          <span className="text-[9px] text-slate-600 block leading-none mt-1">
                            胜 {stats.successCount} / 败 {stats.failureCount}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 relative">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[10px] text-slate-500 font-mono">理论期望均值</span>
                            <button
                              onClick={() => setIsExpectedAvgHelpOpen(true)}
                              className="text-indigo-400 hover:text-indigo-300 transition-colors p-0.5 rounded hover:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer flex items-center justify-center"
                              title="点击查看详细说明"
                              id="expected-avg-help-btn"
                              type="button"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-base font-bold text-indigo-400 block mt-1">{stats.expectedSuccessAvg}%</span>
                          <span className="text-[9px] text-slate-600 block leading-none mt-1">
                            基于公式内置概率
                          </span>
                        </div>
                      </div>

                      {/* Streak details details lookup */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/45 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex justify-between border-r border-slate-850 pr-2">
                          <span className="text-slate-550">最大连胜 :</span>
                          <span className="font-bold text-emerald-400">{stats.maxWinStreak} 连</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-slate-550">最大连败 :</span>
                          <span className="font-bold text-red-400">{stats.maxLossStreak} 连</span>
                        </div>
                      </div>

                      {/* Breakthrough rates distribution breakdowns */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase font-mono tracking-wider">分段强化学统计 (主卡存留数)</span>
                        <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                          {Object.entries(stats.breakthroughCounts).map(([tier, rawVal]) => {
                            const val = rawVal as { total: number; success: number };
                            const rate = val.total > 0 ? Math.round((val.success / val.total) * 100) : 0;
                            return (
                              <div key={tier} className="flex items-center justify-between text-xs bg-slate-950/30 py-1 px-2 rounded-lg border border-slate-900/60 font-mono">
                                <span className="font-bold text-slate-400 text-[11px]">{tier} (向上冲)</span>
                                <span className="text-slate-300">
                                  总 {val.total} 次 — 成功 <span className="text-emerald-400 font-bold">{val.success} 次</span> ({rate}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // --- TAB 2: SANITY STOP LOSS SENTRY ---
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <h3 className="text-xs font-bold font-display text-white">
                        理智安全卫士 & 情绪熔断口
                      </h3>
                    </div>
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono border border-rose-500/20">
                      SENTRY ACTIVE
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      暂无合卡历史。开始您的第一次合卡，开启避坑理智盾 🛡️
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* High-tier Devastating Failure Tilt Sentry warning */}
                      {sanityStats.tiltWarningEvent && (
                        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2 shadow-lg relative overflow-hidden animate-fade-in text-[11px]">
                          <div className="absolute -top-2 -right-2 p-2 text-rose-500/5 pointer-events-none">
                            <ShieldAlert className="w-14 h-14" />
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                            <h4 className="text-rose-400 font-extrabold text-xs tracking-tight flex items-center gap-1 flex-wrap">
                              🚨 「秒卡追投 / 上头高仓」风控拦截警哨！
                            </h4>
                          </div>

                          <p className="text-slate-350 leading-relaxed font-sans">
                            监测到在 <span className="text-amber-400 font-bold">[{sanityStats.tiltWarningEvent.mainLevel}]</span> 高价值突破中，副卡配方 <span className="text-rose-300 font-bold">({sanityStats.tiltWarningEvent.subCard})</span> 遭遇爆卡（突破期望率 {sanityStats.tiltWarningEvent.successRate}%）。
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsTiltDetailExpanded(!isTiltDetailExpanded)}
                              className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors py-1 px-2.5 bg-slate-950 rounded border border-amber-500/10 hover:border-amber-500/25 cursor-pointer flex items-center gap-1 font-medium select-none font-sans"
                              type="button"
                            >
                              <span>{isTiltDetailExpanded ? "隐藏" : "查看"}玩家经典心理崩溃剖析与自救避坑指南</span>
                            </button>
                          </div>

                          {isTiltDetailExpanded && (
                            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-rose-950/40 text-[11px] text-slate-400 mt-1.5 space-y-1.5 animate-fade-in leading-relaxed font-sans">
                              <p className="text-amber-300/90 font-bold font-mono">
                                🧠 冲动心理危机解剖 (2K玩家真实痛点)：
                              </p>
                              <p>
                                1. <span className="font-bold text-amber-400">「不服输」幻觉</span>：刚遭遇了一次 {sanityStats.tiltWarningEvent.successRate}% 高概率失败，大脑会产生“下次必定成功”的生理错觉，从而盲目追加。
                              </p>
                              <p>
                                2. <span className="font-bold text-amber-400">「垫子过载」认知</span>：执迷于高强化期望，从而偏执地陷入连续黑洞，忽略了每一次的独立概率。
                              </p>
                              <p>
                                3. <span className="font-bold text-amber-400">极简理智熔断</span>：呼气放松，适时离开模拟盘，防止连败心态崩溃。
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                        {/* Interactive live comparison grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {[15, 30, 45, 60].map((pct) => {
                            const allowedLossAmt = Math.round(initialCards * (pct / 100));
                            const stopLimitCards = Math.max(0, initialCards - allowedLossAmt);
                            const currentLossAmt = stats.netProfit < 0 ? Math.abs(stats.netProfit) : 0;
                            const isThisBreached = stats.netProfit < 0 && currentLossAmt >= allowedLossAmt;
                            const isSelected = stopLossPercent === pct;

                            return (
                              <button
                                key={pct}
                                onClick={() => {
                                  setStopLossPercent(pct);
                                  triggerToast(`已成功切换至 ${pct}% 止损线，理智评分已重设`, "success");
                                }}
                                className={`text-left p-2 rounded-xl border transition-all duration-350 relative group cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                                    : "bg-slate-950/35 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/40"
                                }`}
                                type="button"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-[11px] font-bold font-mono ${isSelected ? "text-amber-400" : "text-slate-400"}`}>
                                    {pct}% {pct === 15 ? "🛡️ 保守" : pct === 30 ? "🌟 黄金" : pct === 45 ? "⚡ 激进" : "🚨 危险"}
                                  </span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isThisBreached ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                                </div>

                                <div className="mt-1 space-y-0.5 font-sans">
                                  <div className="flex justify-between items-center text-[9px] text-slate-500">
                                    <span>亏损限额:</span>
                                    <span>触哨底线:</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="font-extrabold text-slate-350 font-mono">-{allowedLossAmt}张</span>
                                    <span className="font-extrabold text-rose-455 font-mono">≤{stopLimitCards}张</span>
                                  </div>
                                </div>

                                <div className="mt-1 pt-1 border-t border-slate-900 flex justify-between items-center text-[9px] font-sans">
                                  <span className="text-slate-555">累计回撤:</span>
                                  <span className={`font-mono font-bold ${isThisBreached ? "text-rose-400" : "text-emerald-400"}`}>
                                    {isThisBreached ? "已拉哨 🚨" : "正常安全 ✅"}
                                  </span>
                                </div>

                                {isSelected && (
                                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-b-xl" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Interactive dynamic inline tips based on active stopLossPercent selection */}
                        <div className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-900 leading-normal font-sans">
                          {stopLossPercent === 15 && (
                            <span>🛡️ <strong>保守战术 (15%)</strong>：止损极为灵敏，微跌即告警。适合稳健博弈。</span>
                          )}
                          {stopLossPercent === 30 && (
                            <span>🌟 <strong>黄金战术 (30%) (推荐)</strong>：极佳抗御几率回撤波折，拦截非理性梭哈。</span>
                          )}
                          {stopLossPercent === 45 && (
                            <span>⚡ <strong>激进战术 (45%)</strong>：能容忍宽幅振荡，适合本金非常雄厚的资深玩家。</span>
                          )}
                          {stopLossPercent === 60 && (
                            <span className="text-rose-400 font-medium font-bold">🚨 <strong>危险赌徒 (60%)</strong>：处于心态濒临全面崩坏的高红警告线。本金已损耗过半，切忌在此处追加资金！</span>
                          )}
                        </div>

                        {/* Stop loss trigger warning banner if breached */}
                        {sanityStats.isStopLossBreached && (
                          <div className="p-3 bg-rose-950/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs space-y-1 animate-pulse shadow-inner font-sans animate-fade-in">
                            <p className="font-extrabold flex items-center gap-1.5 text-xs text-rose-400">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                              触发设定的 {stopLossPercent}% 资金回撤报警线！
                            </p>
                            <p className="leading-relaxed text-[11px] text-slate-300">
                              当前持卡量为 <span className="font-bold font-mono text-rose-400 text-xs">{currentTotal}张</span>，起点已累计回撤高达 <span className="font-extrabold font-mono text-rose-400 underline">{sanityStats.lossPercent}%</span>（跌破了您指定的防守限度，底线为维持在 {Math.max(0, initialCards - Math.round(initialCards * (stopLossPercent / 100)))} 张卡以上）。<span className="font-bold text-rose-400">物理防区已被彻底击穿！如果您需要更多操盘弹性，建议切换上方更高档位止损，或暂停今日合卡。</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          {/* Ledger List Section (History Cards) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col min-h-[400px]">
            
            <div className="flex items-center justify-between border-b border-slate-810 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-white tracking-tight">合卡账目历史</h3>
              </div>
              
              {history.length > 0 && (
                <button
                  onClick={() => setIsClearAllConfirmOpen(true)}
                  className="text-red-400 hover:text-red-300 transition-colors text-xs font-medium bg-red-950/20 px-2 py-1 rounded border border-red-500/10 cursor-pointer"
                  id="btn-click-clear-all"
                >
                  一键清空
                </button>
              )}
            </div>

            {/* Quick Symbol Timeline view request from user */}
            {history.length > 0 && (
              <div className="mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-[10px] text-slate-500 font-medium uppercase font-mono tracking-wider flex justify-between pb-1 border-b border-slate-900/40">
                  <span>直观胜率分布走势 (挂载垫子观察)</span>
                  <span className="text-amber-500">← 最新在前</span>
                </div>
                
                <div className="overflow-x-auto pb-2 pt-0.5 scroll-smooth custom-scrollbar">
                  <div className="space-y-1.5 min-w-max">
                    {/* Row 1: Success ✓ */}
                    <div className="flex items-center gap-2">
                      <div className="w-12 text-[10px] font-bold text-emerald-400 font-mono shrink-0 select-none flex items-center justify-end gap-1 sticky left-0 bg-slate-950/95 backdrop-blur-sm border-r border-slate-900/60 pr-2 z-10 py-1.5">
                        <span className="text-xs">✓</span>
                        <span className="text-[9px] opacity-80 font-normal">成功</span>
                      </div>
                      <div className="flex items-center gap-1 pl-1">
                        {symbolsSeries.map((item) => (
                          <div
                            key={`success-${item.id}`}
                            className={`w-7 h-7 rounded-lg shrink-0 flex flex-col items-center justify-center text-xs font-bold leading-none select-none transition-all ${
                              item.result
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold scale-100"
                                : "bg-slate-950/30 border border-slate-900/30 text-slate-800/30 scale-90"
                            }`}
                            title={item.result ? `${item.level} 盈亏: +${item.profit}` : "此处无成功记录"}
                          >
                            {item.result ? (
                              <>
                                ✓
                                <span className="text-[8px] opacity-70 font-mono scale-90">{item.level.replace("突", "")}</span>
                              </>
                            ) : (
                              <span className="text-[8px] opacity-30 font-mono scale-90">•</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: Failure ✗ */}
                    <div className="flex items-center gap-2">
                      <div className="w-12 text-[10px] font-bold text-red-400 font-mono shrink-0 select-none flex items-center justify-end gap-1 sticky left-0 bg-slate-950/95 backdrop-blur-sm border-r border-slate-900/60 pr-2 z-10 py-1.5">
                        <span className="text-xs">✗</span>
                        <span className="text-[9px] opacity-80 font-normal">失败</span>
                      </div>
                      <div className="flex items-center gap-1 pl-1">
                        {symbolsSeries.map((item) => (
                          <div
                            key={`fail-${item.id}`}
                            className={`w-7 h-7 rounded-lg shrink-0 flex flex-col items-center justify-center text-xs font-bold leading-none select-none transition-all ${
                              !item.result
                                ? "bg-red-500/15 border border-red-500/30 text-red-400 font-bold scale-100"
                                : "bg-slate-950/30 border border-slate-900/30 text-slate-800/30 scale-90"
                            }`}
                            title={!item.result ? `${item.level} 盈亏: ${item.profit}` : "此处无失败记录"}
                          >
                            {!item.result ? (
                              <>
                                ✗
                                <span className="text-[8px] opacity-70 font-mono scale-90">{item.level.replace("突", "")}</span>
                              </>
                            ) : (
                              <span className="text-[8px] opacity-30 font-mono scale-90">•</span>
                            )}
                          </div>
                        ))}
                        {symbolsSeries.length < 32 && (
                          <div className="text-[9px] text-slate-600 font-mono pl-2 shrink-0 self-center">等新数据...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main scroll list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[480px] p-0.5">
              <AnimatePresence initial={false}>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mb-3 border border-slate-800">
                      <History className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm">暂无合卡盈亏单据</p>
                    <p className="text-xs text-slate-600 mt-1">在左侧录入结果后将自动在此列记</p>
                  </div>
                ) : (
                  history.map((record) => {
                    const formattedTime = (() => {
                      try {
                        const d = new Date(record.timestamp);
                        // Month-Day Hours:Minutes
                        const pad = (num: number) => String(num).padStart(2, '0');
                        return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      } catch {
                        return "";
                      }
                    })();

                    // Expected profits check
                    const ruleForThis = COMBINE_RULES.find(r => r.level === record.currentMainLevel);
                    const optForThis = ruleForThis?.subOptions.find(o => o.name === record.subCardType);
                    const subBase = optForThis?.subBaseCards || 1;
                    const mainBase = ruleForThis?.mainBaseCards || 1;

                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="overflow-hidden"
                      >
                        <div className="group relative bg-slate-950 p-3.5 rounded-xl border border-slate-850 hover:border-slate-700/80 transition-all flex items-center justify-between gap-4">
                          
                          <div className="space-y-1">
                            {/* Date time & Formula name */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formattedTime}
                              </span>
                              <span className="text-xs font-semibold text-slate-200">
                                {record.currentMainLevel} + {record.subCardType.split("（")[0]}
                              </span>
                            </div>

                            {/* Probability metadata description */}
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                              <span>概率: {record.successRate}%</span>
                              <span>•</span>
                              <span>消耗值: {mainBase + subBase}张 (主{mainBase} / 副{subBase})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            
                            {/* Status and Profit indicators side by side */}
                            <div className="flex flex-col items-end text-right">
                              
                              <div className="flex items-center gap-1.5">
                                {/* Profit */}
                                <span className={`text-base font-extrabold font-mono ${
                                  record.result ? "text-emerald-400" : "text-red-400"
                                }`}>
                                  {record.profit > 0 ? `+${record.profit}` : record.profit}
                                </span>
                                
                                {/* Tag indicator */}
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold select-none ${
                                  record.result ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-200"
                                }`}>
                                  {record.result ? "✓" : "✗"}
                                </span>
                              </div>

                              <span className="text-[9px] text-slate-600 block font-mono">
                                盈亏结存
                              </span>

                            </div>

                            {/* Direct Delete Trigger Icon button */}
                            <button
                              onClick={() => setDeleteConfirmId(record.id)}
                              className="p-1 px-1.5 bg-slate-900 hover:bg-red-950/50 text-slate-500 hover:text-red-400 rounded border border-slate-800 hover:border-red-900/40 transition-all cursor-pointer"
                              title="删除记录"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>

                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>🏀 NBA2KOL2 合卡盈亏记录器 — 专为赌卡玩家设计的幂等账本系统</p>
          <p className="text-[10px] text-slate-600 font-mono">
            纯本地端轻量级计算器 • 数据不经网络，全由 localStorage 离线存储保护
          </p>
        </div>
      </footer>

      {/* ==================== DIALOG MODALS ==================== */}

      {/* 1. Modal: SET INITIAL CARDS */}
      <AnimatePresence>
        {isInitialSetupOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  管理/修改初始持卡量
                </h3>
                <button 
                  onClick={() => setIsInitialSetupOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInitialCards} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">
                    当前持有的 1突卡 总初始存量:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tempInitialInput}
                    onChange={(e) => setTempInitialInput(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 font-bold font-mono text-base"
                    placeholder="例如: 100"
                    autoFocus
                    required
                    id="input-initial-cards-amt"
                  />
                  <span className="text-[10px] text-slate-500 leading-snug block pt-1">
                    系统将以该卡量为起点基数。实时总资产 = 初始卡量 + 所有历史记录对应的盈亏代数和。
                  </span>
                </div>

                {history.length > 0 && (
                  <div className="p-3 bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      注意: 当前已有交易记录。修改初卡量仅更改初始起点值，<span className="font-semibold text-amber-300">已有历史账目盈亏不会发生变化</span>。
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInitialSetupOpen(false)}
                    className="flex-1 py-2 px-4 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-orange-500/10"
                    id="btn-save-initial-amt"
                  >
                    保存初始卡量
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1.1 Modal: SECONDARY CONFIRM ACTION */}
      <AnimatePresence>
        {isInitialConfirmationOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-white text-base">修改初始值二次确认</h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                当前已有合卡历史记录！修改初始卡量将<span className="font-bold text-amber-400">重新计算并刷新当前总计卡数</span>（但历史记录中每笔合卡的盈亏增量保持不变），是否确认要继续？
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInitialConfirmationOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveInitialCards}
                  className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-orange-500/10 cursor-pointer"
                  id="btn-confirm-save-initial-amt"
                >
                  确认继续
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: SINGLE RECORD DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-white text-base">删除确认</h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                删除后该条合卡记录将<span className="font-bold text-rose-400">无法恢复</span>，且当前总卡量及各项概率参数将根据剩余清单重新计算，是否确认？
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteRecord(deleteConfirmId)}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-500/10"
                  id="btn-confirm-single-delete"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: CLEAR ALL HISTORY CONFIRMATION */}
      <AnimatePresence>
        {isClearAllConfirmOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-white text-base">一键清空记录确认</h3>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                您即将<span className="font-bold text-red-400">清空所有的合卡盈亏记录</span>！清空后历史资产曲线、概率表现将全部洗白，当前总合卡量将重置为初始卡数量（{initialCards}张）。此操作不可撤销，请谨慎选择！
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-500/10 cursor-pointer"
                  id="btn-execute-clear-all"
                >
                  重置并清空
                </button>
                <button
                  type="button"
                  onClick={() => setIsClearAllConfirmOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.5. Modal: ANTI-TILT POPUP SPECIAL WARNING */}
      <AnimatePresence>
        {antiTiltModalConfig?.isOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden"
            >
              {/* Top ambient glowing strip based on hazard level */}
              <div className={`absolute top-0 inset-x-0 h-1.5 ${
                antiTiltModalConfig.score < 20 ? "bg-red-500 shadow-[0_2px_10px_rgba(239,68,68,0.5)]" : "bg-amber-500"
              }`} />

              <div className="flex items-start gap-3.5 text-left">
                <div className={`p-2.5 rounded-xl ${
                  antiTiltModalConfig.score < 20 ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                } shrink-0`}>
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-[15px] tracking-wide font-display">
                    {antiTiltModalConfig.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">理智综合评分</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs ${
                      antiTiltModalConfig.score < 20 ? "text-red-400 bg-red-950/40" : "text-amber-400 bg-amber-950/40"
                    }`}>
                      {antiTiltModalConfig.score} / 100 分
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3.5 text-left">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                    🚨 事件截停原因：
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-0.5 font-medium">
                    {antiTiltModalConfig.message}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-900 font-sans">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                    🧘 安全卫士理智疏导：
                  </span>
                  <p className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/10 leading-relaxed mt-1">
                    {antiTiltModalConfig.advice}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  disabled={countdownSeconds > 0}
                  onClick={() => {
                    setAntiTiltModalConfig(null);
                    setHasShownAlertInSession(true);
                    triggerToast("赌徒有两颗心，贪心和不甘心，游戏而已没啥大不了 🍀", "success");
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    countdownSeconds > 0
                      ? "bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98] cursor-pointer shadow-md"
                  }`}
                >
                  {countdownSeconds > 0 ? (
                    <span className="flex items-center gap-2 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      心理重构，静心等待中... ({countdownSeconds}秒)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      按规自律合卡，我已恢复冷静 (大吉大利)
                    </span>
                  )}
                </button>
                <p className="text-center text-[9px] text-slate-500">
                  理智安全卫士・情绪静止安全闸
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal: HELP & EXPLANATIONS */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-500" />
                  哈拉与合卡机制说明 (PDR 指导)
                </h3>
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-amber-500 pl-1.5 mb-1">
                    为什么以 1突卡 作为统一结算单位？
                  </h4>
                  <p>
                    在 NBA2KOL2 合卡体系中，高级突破等级卡都是通过消耗 1突卡 累积合成的。为了消除异形卡之间的换算歧义，我们把不同等级的卡全部统一折算成最底层的 1突卡 面额。
                  </p>
                  <ul className="list-disc list-inside mt-1.5 text-slate-400 space-y-1 font-mono pl-1">
                    <li>1突卡 = 1张 1突卡值</li>
                    <li>2突卡 = 2张 1突卡值</li>
                    <li>3突卡 = 4张 1突卡值</li>
                    <li>4突卡 = 8张 1突卡值</li>
                    <li>5突卡 = 16张 1突卡值</li>
                    <li>6突卡 = 32张 1突卡值</li>
                    <li>7突卡 = 64张 1突卡值</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-amber-500 pl-1.5 mb-1">
                    合卡盈亏的动态公式怎么计算的？
                  </h4>
                  <p>
                    每次合成，目标卡等级比主卡多一级（如3突合成4突）。在真实合卡中，失败时主卡是保留不退化的，只损耗副卡。公式如下：
                  </p>
                  <div className="bg-slate-950 p-2 text-amber-400 font-mono text-[10px] mt-1.5 rounded border border-slate-850">
                    <div>◎ 成功：净赚 = 主卡本体值 − 副卡值</div>
                    <div>◎ 失败：净亏 = 损失副卡值 (主卡完整保留)</div>
                  </div>
                  <p className="mt-1.5">
                    例如：您拿 <strong className="text-slate-200">3突 (主值 4张)</strong> 配合 <strong className="text-slate-200">2突2星副卡 (副值 3张)</strong> 向上合 <strong className="text-amber-500">4突 (目标值 8张)</strong>，此时：
                  </p>
                  <ul className="list-disc list-inside mt-1 text-slate-400 space-y-1 pl-1">
                    <li>
                      若<strong className="text-emerald-400">成功 (✓)</strong> : 主卡成功升级。
                      <br />计算：<code className="text-amber-500 font-mono font-bold">4 - 3 = +1</code>，净赚 1 张。
                    </li>
                    <li>
                      若<strong className="text-red-400">失败 (✗)</strong> : 升级失败，主卡保留，仅损耗副卡。
                      <br />计算：<code className="text-red-400 font-mono font-bold">失败仅损失副卡 = -3</code>，净亏 3 张。
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-amber-500 pl-1.5 mb-1">
                    关于这套工具的功能和幂等保障
                  </h4>
                  <p>
                    本工具有强力的一揽子计算与安全约束机制。历史盈亏由底册直接重新累加得出，无二次溢出风险。全部存储放在本地缓存保护，无断网或隐私泄露风险，助力NBA玩家随时随地掌握今日运势！
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="w-full py-2.5 bg-slate-800 text-slate-100 hover:bg-slate-700 rounded-lg text-xs font-bold transition"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Modal: THEORETICAL EXPECTED MEAN EXPLANATION */}
      <AnimatePresence>
        {isExpectedAvgHelpOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  什么是「理论期望均值」？
                </h3>
                <button 
                  onClick={() => setIsExpectedAvgHelpOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3.5 leading-relaxed">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400">
                  <p className="text-slate-200 font-medium mb-1">💡 一句话理解：</p>
                  这是您历史记录的所有合卡方案的<span className="text-indigo-400 font-semibold font-mono">「加权数学理论胜率」</span>。用来衡量您的真实运气是超越了概率，还是落后于概率。
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-indigo-500 pl-1.5 mb-1.5">
                    1. 它是怎么计算的？
                  </h4>
                  <p>
                    每个合卡方案都对应固定的成功概率。系统会将您每一次记录方案对应的官方理论概率进行累加，然后除以总合卡次数。
                  </p>
                  <div className="bg-slate-950 p-2 text-indigo-450 font-mono text-[10px] mt-1.5 rounded border border-slate-850">
                    <div>◎ 理论期望均值 = (所有记录的单次公式胜率之和) / 总记录次数</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-indigo-500 pl-1.5 mb-1.5">
                    2. 如何用来观察「手气运势」？
                  </h4>
                  <p className="mb-2">
                    将您的 <span className="text-emerald-400 font-bold">实际合成胜率</span> 与 <span className="text-indigo-400 font-bold">理论期望均值</span> 对比，即可科学反映您的真实气运：
                  </p>
                  <ul className="space-y-1.5 text-slate-400 pl-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0 font-bold">★ 实际 {`>`} 期望</span>
                      <span>：手气极佳 / 欧皇附体！实际合成比理论成功得更多。 (说明运气爆发)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-400 shrink-0 font-bold">★ 实际 ≈ 期望</span>
                      <span>：符合规律 / 正常发挥。稳定地向数学概率收敛。</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 shrink-0 font-bold">★ 实际 {`<`} 期望</span>
                      <span>：手气欠佳 / 处于水逆。实际成功数少于理论概率学，最好暂缓高突！</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-indigo-500 pl-1.5 mb-1">
                    3. 通俗的小例子
                  </h4>
                  <p>
                    假设您记录了 2 次合卡操作：
                  </p>
                  <ul className="list-disc list-inside mt-1 text-slate-400 space-y-1 font-mono pl-1">
                    <li>第 1 次使用：3突主卡 + 2突2星辅助 (成功率 <span className="text-amber-400">72%</span>)</li>
                    <li>第 2 次使用：3突主卡 + 1突辅助 (成功率 <span className="text-amber-400">24%</span>)</li>
                  </ul>
                  <p className="mt-1.5">
                    那么您的 <strong className="text-indigo-400 font-mono">理论期望均值 = (72% + 24%) / 2 = 48%</strong>。
                    <br />如果你第1次成功、第2次失败（成功率 50%），则实际胜率（50%）稍高于期望均值（48%），恭喜您算小幅跑赢了概率！
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpectedAvgHelpOpen(false)}
                  className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
                >
                  理解了，关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Modal: INTERACTIVE STOP LOSS GUIDE */}
      <AnimatePresence>
        {isStopLossHelpOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  最大回撤止损线设置指南
                </h3>
                <button 
                  onClick={() => setIsStopLossHelpOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-400">
                  <p className="font-bold mb-1">💡 为什么要设置这个警戒线？</p>
                  <p>
                    在经典的 FIFA / FC / NBA2K 系列游戏中，几乎所有合卡崩盘事件都起源于<strong>“连黑后的不甘心”</strong>与<strong>“报复性追高”</strong>。设置一条钢铁般的止损线，会在亏损达到指定比例时强制拉响警报，帮助您克服多巴胺作祟，保护战力火种。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white text-[13px] border-l-2 border-amber-500 pl-1.5 mb-2">
                    📊 阻险区间四挡说明
                  </h4>
                  
                  <div className="space-y-2.5">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-emerald-400 font-bold font-mono">15% —— 保守安全型</span>
                        <span className="text-[10px] text-slate-500">超轻回撤</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        <strong>适用人群</strong>：总身家较紧凑，或已经赚到了丰厚的盈利浮盈、想要绝对守住收益的玩家。一旦稍微踩雷连败两三把，系统即发出警告，劝导适时休息。
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/20 ring-1 ring-amber-500/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-amber-400 font-extrabold font-mono">30% —— 黄金平衡型 【推荐默认 🌟】</span>
                        <span className="text-[10px] text-amber-500/80 font-bold">科学甜点位</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        <strong>适用人群</strong>：大众玩家与高频合卡师首选。它给合卡的随机性预留了足够的“抗摆动空间”（即不会因为偶尔一次运差直接报警），又在总体回撤跌破30%时起到强大的降温刹车作用。
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-orange-400 font-bold font-mono">45% —— 激进冒险型</span>
                        <span className="text-[10px] text-slate-500">高风险抗性</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        <strong>适用人群</strong>：大额卡本的资深交易商、拥有极强心理承受力的玩家。它在半数资本折损之前不会启动，适合短时间连续大规模合成博暴击的狂热流派。
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-rose-950/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-rose-400 font-bold font-mono">60% —— 危险赌徒型</span>
                        <span className="text-[10px] text-rose-500">红色警报线</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        <strong>不推荐！</strong>当累计缩水高达 60% 时，根据「大数几何破产」原理，在筹码只剩不到四成的情况下，哪怕全部点极高概率的中低突公式，经受下一次连黑概率的次数已经微乎其微。此时继续往往意味着最后一搏、两手空空。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1 text-[11px]">
                    🧠 数学避坑小常识：为什么上头点高概率也救不回来？
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    假如一个玩家初始 200 张卡，亏到只剩 40 张（亏损 80%）。
                    因为卡本缩水，他只能进行极少次数的合卡：
                    即使使用中途 72% 的黄金公式，在这个次数下<strong>一旦连续两次不中就会彻底破产</strong>。这种“筹码量不足以吸收数学方差”的现象，就是赌徒破产定理的本质。因此，及时在 <strong>30%</strong> 停手离场，保存火种，改天分批操作才是职业合卡经理人的明智之选。
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStopLossPercent(30);
                    setIsStopLossHelpOpen(false);
                    triggerToast("已一键设置为精英合卡经理人推荐的黄金 30% 止损！", "success");
                  }}
                  className="flex-1 py-2.5 bg-slate-800 text-amber-400 hover:bg-slate-700 rounded-lg text-xs font-bold transition duration-150 cursor-pointer text-center"
                >
                  设为 30% 并关闭
                </button>
                <button
                  type="button"
                  onClick={() => setIsStopLossHelpOpen(false)}
                  className="py-2.5 px-6 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
