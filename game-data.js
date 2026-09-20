// 化学実験体験ゲーム 共通データ管理
const ChemistryGame = (() => {
  const KEY = 'chemistry_lab_save_v1';
  const DEFAULT = {
    level: 1,
    exp: 0,
    totalExp: 0,
    games: {
      titration: { cleared: false, bestScore: null, bestExp: 0 },
      indicator: { cleared: false, bestScore: null, bestExp: 0 },
      report: { cleared: false, bestScore: null, bestExp: 0 }
    }
  };

  const clone = obj => JSON.parse(JSON.stringify(obj));

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      const data = JSON.parse(raw);
      return {
        ...clone(DEFAULT),
        ...data,
        games: {
          ...clone(DEFAULT).games,
          ...(data.games || {})
        }
      };
    } catch (e) {
      return clone(DEFAULT);
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function expForNextLevel(level) {
    if (level >= 10) return Infinity;
    // Lv.1→2:100, Lv.2→3:150, Lv.3→4:200 ...
    return 100 + (level - 1) * 50;
  }

  function addExp(amount) {
    const data = load();
    const beforeLevel = data.level;
    amount = Math.max(0, Math.round(amount));
    data.exp += amount;
    data.totalExp += amount;

    while (data.level < 10 && data.exp >= expForNextLevel(data.level)) {
      data.exp -= expForNextLevel(data.level);
      data.level++;
    }
    save(data);
    return { data, gained: amount, beforeLevel, afterLevel: data.level };
  }

  function complete(gameId, score, exp) {
    const data = load();
    const game = data.games[gameId];
    if (!game) return null;

    const oldBest = game.bestScore == null ? -1 : game.bestScore;
    const isNewBest = score > oldBest;
    game.cleared = true;

    // 同じゲームを何度も遊んでもEXPを無限に稼げないよう、最高記録との差分だけ加算。
    const previousExp = game.bestExp || 0;
    const newExp = Math.max(previousExp, Math.round(exp));
    const expGain = Math.max(0, newExp - previousExp);

    if (isNewBest) game.bestScore = Math.round(score);
    game.bestExp = newExp;
    save(data);

    const levelResult = addExp(expGain);
    return {
      ...levelResult,
      score: Math.round(score),
      isNewBest,
      expGain,
      game
    };
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  function getProgress() {
    const data = load();
    const need = expForNextLevel(data.level);
    return {
      ...data,
      need,
      progress: Number.isFinite(need) ? Math.min(100, (data.exp / need) * 100) : 100
    };
  }

  function renderHeader() {
    const els = document.querySelectorAll('[data-player-level]');
    const bars = document.querySelectorAll('[data-exp-bar]');
    const exps = document.querySelectorAll('[data-player-exp]');
    const p = getProgress();
    els.forEach(el => el.textContent = `Lv.${p.level}`);
    exps.forEach(el => el.textContent = p.level >= 10 ? 'MAX' : `${p.exp} / ${p.need} EXP`);
    bars.forEach(el => el.style.width = `${p.progress}%`);
  }

  return { load, save, addExp, complete, reset, getProgress, expForNextLevel, renderHeader };
})();

window.ChemistryGame = ChemistryGame;
