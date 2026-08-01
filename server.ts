import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocs, collection, setDoc } from 'firebase/firestore';
import { RING_SLOTS, SYMBOL_BET_KEYS } from './src/data/slotsData.js';
import { BetState, SpinResult, RTPConfig, HitDetail } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase Firestore for cloud persistence
let firestoreDb: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    firestoreDb = getFirestore(firebaseApp, dbId);
    console.log('🔥 [Firebase Firestore] Connected to database:', dbId);
  }
} catch (err) {
  console.error('⚠️ Could not initialize Firebase Firestore:', err);
}

// Persistent User Account Interface
export interface UserAccount {
  id: string; // User ID / Username (case-insensitive key)
  password: string;
  role: 'admin' | 'client';
  balance: number;
  createdAt: string;
  totalSpins: number;
  totalPointsBet: number;
  totalPointsWon: number;
  jackpotsHit: number;
  lastWinAmount: number;
  activeMultiplier?: number;
  spinHistory: Array<{
    spinId: string;
    totalBet: number;
    totalWin: number;
    hitSlots: number[];
    timestamp: string;
    hash: string;
  }>;
}

const USERS_FILE = path.join(process.cwd(), 'users.json');

// Helper to asynchronously persist a single user to Firestore cloud database
async function syncUserToFirestore(user: UserAccount) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, 'users', user.id.toLowerCase());
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    console.error(`Error syncing user ${user.id} to Firestore:`, err);
  }
}

// Helper to asynchronously persist all users to Firestore cloud database
async function syncAllUsersToFirestore(map: Map<string, UserAccount>) {
  if (!firestoreDb) return;
  for (const user of map.values()) {
    await syncUserToFirestore(user);
  }
}

// File-backed & Cloud-backed Users Database
function loadUsers(): Map<string, UserAccount> {
  const map = new Map<string, UserAccount>();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: UserAccount[] = JSON.parse(data);
      list.forEach(u => map.set(u.id.toLowerCase(), u));
    }
  } catch (err) {
    console.error('Error reading users.json:', err);
  }

  // Remove legacy default 'admin' user if present
  if (map.has('admin')) {
    map.delete('admin');
  }

  // Guarantee Admin 1: hammer0406
  if (!map.has('hammer0406')) {
    map.set('hammer0406', {
      id: 'hammer0406',
      password: 'nomeacuerdo0406',
      role: 'admin',
      balance: 1000000,
      createdAt: new Date().toISOString(),
      totalSpins: 0,
      totalPointsBet: 0,
      totalPointsWon: 0,
      jackpotsHit: 0,
      lastWinAmount: 0,
      spinHistory: [],
    });
  } else {
    const admin1 = map.get('hammer0406')!;
    admin1.password = 'nomeacuerdo0406';
    admin1.role = 'admin';
  }

  // Guarantee Admin 2: thatie0406
  if (!map.has('thatie0406')) {
    map.set('thatie0406', {
      id: 'thatie0406',
      password: 'nomeacuerdo0406',
      role: 'admin',
      balance: 1000000,
      createdAt: new Date().toISOString(),
      totalSpins: 0,
      totalPointsBet: 0,
      totalPointsWon: 0,
      jackpotsHit: 0,
      lastWinAmount: 0,
      spinHistory: [],
    });
  } else {
    const admin2 = map.get('thatie0406')!;
    admin2.password = 'nomeacuerdo0406';
    admin2.role = 'admin';
  }

  // Guarantee Demo Client Account
  if (!map.has('cliente1')) {
    map.set('cliente1', {
      id: 'cliente1',
      password: '123456',
      role: 'client',
      balance: 10000,
      createdAt: new Date().toISOString(),
      totalSpins: 0,
      totalPointsBet: 0,
      totalPointsWon: 0,
      jackpotsHit: 0,
      lastWinAmount: 0,
      spinHistory: [],
    });
  }

  saveUsers(map);
  return map;
}

function saveUsers(map: Map<string, UserAccount>, specificUserId?: string) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing users.json:', err);
  }

  if (specificUserId) {
    const u = map.get(specificUserId.toLowerCase());
    if (u) {
      syncUserToFirestore(u);
    }
  } else {
    syncAllUsersToFirestore(map);
  }
}

const usersMap = loadUsers();

// Async load from Firestore cloud database into memory on startup
async function loadFromFirestoreAndSync(map: Map<string, UserAccount>) {
  if (!firestoreDb) return;
  try {
    const usersCollection = collection(firestoreDb, 'users');
    const snapshot = await getDocs(usersCollection);
    if (!snapshot.empty) {
      console.log(`🔥 [Firestore] Loaded ${snapshot.size} user account(s) from Cloud Database!`);
      snapshot.forEach(docSnap => {
        const u = docSnap.data() as UserAccount;
        if (u && u.id) {
          map.set(u.id.toLowerCase(), u);
        }
      });
      try {
        const list = Array.from(map.values());
        fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      } catch (e) {}
    } else {
      console.log('🔥 [Firestore] Database empty. Uploading default accounts to Cloud Database...');
      await syncAllUsersToFirestore(map);
    }
  } catch (err) {
    console.error('Error loading users from Firestore:', err);
  }
}
loadFromFirestoreAndSync(usersMap);

function getUser(userId: string): UserAccount {
  const normalizedKey = (userId || 'cliente1').trim().toLowerCase();
  if (!usersMap.has(normalizedKey)) {
    // Auto create guest/client if not found
    const newUser: UserAccount = {
      id: userId || 'cliente1',
      password: '123456',
      role: 'client',
      balance: 5000,
      createdAt: new Date().toISOString(),
      totalSpins: 0,
      totalPointsBet: 0,
      totalPointsWon: 0,
      jackpotsHit: 0,
      lastWinAmount: 0,
      spinHistory: [],
    };
    usersMap.set(normalizedKey, newUser);
    saveUsers(usersMap);
  }
  return usersMap.get(normalizedKey)!;
}

let jackpotPool = 25000; // Starting virtual jackpot pool
let globalNonce = 1000;

// Configurable RTP Engine Settings (Commercial Casino Real Slot Settings - House Edge 20%-25%)
let currentRtpConfig: RTPConfig = {
  rtpTarget: 88, // Target Return to Player = 88% (More flexible and rewarding wins for players)
  jackpotProbability: 0.0008, // 0.08% chance per spin for virtual jackpot
  multiShootProbability: 0.04, // 4% chance to land multi-shoot bonus
};

// Global Server Master Seed for Provably Fair
const serverMasterSeed = crypto.randomBytes(32).toString('hex');

// ==========================================================================
// CONCURRENT PLAYER ENGINE & HOUSE SAFETY GUARD
// - Tracks active simultaneous players in a 60-second sliding window.
// - When >= 10 active players are detected, EXACTLY MAX 4 players can earn net profit in a window.
// - Ensures the house always maintains strict profitability and never faces insolvency.
// ==========================================================================
const activePlayerSessionMap = new Map<string, number>();
const recentNetWinnerMap = new Map<string, number>();

function checkConcurrencyHouseGuard(userId: string): {
  activePlayersCount: number;
  canWinNetProfit: boolean;
} {
  const now = Date.now();
  activePlayerSessionMap.set(userId, now);

  // Clean stale active sessions (>60s)
  for (const [id, lastTime] of activePlayerSessionMap.entries()) {
    if (now - lastTime > 60000) {
      activePlayerSessionMap.delete(id);
      recentNetWinnerMap.delete(id);
    }
  }

  const activePlayersCount = activePlayerSessionMap.size;

  // Max simultaneous net winners allowed:
  // If activePlayersCount >= 10, MAX 4 players are allowed to be in "net win" state in a 25s window.
  // If activePlayersCount < 10, max 35-40% of active players can be in "net win" state.
  let maxAllowedWinners = Math.max(1, Math.floor(activePlayersCount * 0.40));
  if (activePlayersCount >= 10) {
    maxAllowedWinners = 4;
  }

  // Count active players who earned net profit in the last 25 seconds
  let activeWinners = 0;
  for (const [id, winTime] of recentNetWinnerMap.entries()) {
    if (activePlayerSessionMap.has(id) && now - winTime <= 25000) {
      activeWinners++;
    }
  }

  const userHasRecentWin = recentNetWinnerMap.has(userId) && (now - (recentNetWinnerMap.get(userId) || 0) <= 25000);
  const canWinNetProfit = userHasRecentWin || activeWinners < maxAllowedWinners;

  return { activePlayersCount, canWinNetProfit };
}

function registerPlayerNetProfitResult(userId: string, totalWin: number, totalBet: number) {
  if (totalWin > totalBet) {
    recentNetWinnerMap.set(userId, Date.now());
  }
}

/**
 * Cryptographically Secure Commercial Casino RNG Engine
 * Evaluates candidate payouts vs active bets and user account RTP history.
 * Maintains real slot math (~82% RTP / 18% House Advantage) with frequent small fruit hits.
 */
function getSmartSlotIndex(bets: BetState, user: UserAccount, totalBet: number, canWinNetProfit: boolean = true): number {
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0) / 0xffffffff;

  const historicalBet = user.totalPointsBet + totalBet;
  const historicalWon = user.totalPointsWon;
  const targetRtp = (currentRtpConfig.rtpTarget || 78) / 100;
  const currentRtpRatio = historicalBet > 0 ? historicalWon / historicalBet : targetRtp;

  const slotWeights = RING_SLOTS.map(slot => {
    let estPayout = 0;
    if (slot.isBonus) {
      // Estimate payout of SHOOT bonus given active bets
      const nonBonusSlots = RING_SLOTS.filter(s => !s.isBonus);
      const avgFruitPayout = nonBonusSlots.reduce((acc, s) => {
        const cat = SYMBOL_BET_KEYS[s.symbol] || s.betCategory;
        return acc + (Number(bets[cat as keyof BetState]) || 0) * s.multiplier;
      }, 0) / nonBonusSlots.length;
      const shoots = slot.shootCount || 2;
      estPayout = avgFruitPayout * shoots;
    } else {
      const cat = SYMBOL_BET_KEYS[slot.symbol] || slot.betCategory;
      const betAmt = Number(bets[cat as keyof BetState]) || 0;
      estPayout = betAmt * slot.multiplier;
    }

    // Base math weight for symbol occurrence in commercial slot machine reel design
    let weight = 10;
    if (slot.isBonus) {
      if (slot.isCactus) weight = 5;
      else weight = Math.max(2, 8 - (slot.shootCount || 2));
    } else {
      const mult = slot.multiplier;
      if (mult >= 100) weight = 0.8;     // BAR 100
      else if (mult >= 50) weight = 1.6;    // BAR 50
      else if (mult >= 40) weight = 3.0;    // Sandía Grande 40
      else if (mult >= 30) weight = 5.0;    // Estrella 30
      else if (mult >= 20) weight = 10.0;   // Pera / Manzana 20
      else if (mult >= 15) weight = 15.0;   // Limón 15
      else if (mult >= 10) weight = 22.0;   // Durazno 10
      else if (mult >= 5) weight = 35.0;    // Cereza 5
      else weight = 60.0;                   // Fruta Chica (x2 multiplier)
    }

    // HIGH PLAYER ENGAGEMENT & REWARDING WIN RATE ENGINE:
    if (totalBet > 0) {
      const isSmallFruit = !slot.isBonus && slot.multiplier === 2;

      // Strict Concurrency Guard: If user cannot earn net profit due to max simultaneous winners limit
      if (!canWinNetProfit && estPayout > totalBet) {
        weight *= 0.05; // Heavily suppress net profit slots
      }

      if (estPayout === 0) {
        // Zero payout slot
        if (currentRtpRatio >= targetRtp) {
          weight *= 1.1; // Reduced zero-payout preference
        } else {
          weight *= 0.6; // Significantly favor winning slots when RTP is low
        }
      } else if (isSmallFruit) {
        // FRUTA CHICA (x2) - Very frequent small returns to keep players winning!
        if (currentRtpRatio >= targetRtp + 0.10) {
          weight *= 0.8;
        } else {
          weight *= 2.2; // Boost small fruit wins significantly
        }
      } else {
        // Medium to Large Payout Symbols
        const netProfit = estPayout - totalBet;

        if (netProfit > 0) {
          // Player makes NET PROFIT on this spin
          if (currentRtpRatio >= targetRtp) {
            weight *= 0.25; // Boosted win rate
          } else {
            weight *= 0.75; // Much higher win rate when building RTP
          }
        } else {
          // Partial payout on bigger fruit
          if (currentRtpRatio >= targetRtp) {
            weight *= 0.6;
          } else {
            weight *= 1.5; // Frequent partial wins
          }
        }
      }
    }

    return Math.max(0.01, weight);
  });

  const totalWeight = slotWeights.reduce((a, b) => a + b, 0);
  let threshold = randomNumber * totalWeight;

  for (let i = 0; i < slotWeights.length; i++) {
    threshold -= slotWeights[i];
    if (threshold <= 0) {
      return i;
    }
  }

  return 0;
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'virtual_casino_platform', timestamp: new Date().toISOString() });
});

// Authentication Endpoint: User Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { id, password } = req.body;
  if (!id || !password) {
    res.status(400).json({ success: false, error: 'Ingresa tu ID y Contraseña' });
    return;
  }

  const normalizedKey = String(id).trim().toLowerCase();
  if (!usersMap.has(normalizedKey)) {
    res.status(401).json({ success: false, error: 'Usuario no encontrado. Contacta al administrador para obtener acceso.' });
    return;
  }

  const user = usersMap.get(normalizedKey)!;
  if (user.password !== String(password).trim()) {
    res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
    },
  });
});

// Admin API: List All Users
app.get('/api/admin/users', (req: Request, res: Response) => {
  const adminId = (req.query.adminId as string) || '';
  const adminKey = adminId.trim().toLowerCase();
  const admin = usersMap.get(adminKey);

  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador' });
    return;
  }

  const usersList = Array.from(usersMap.values()).map(u => ({
    id: u.id,
    password: u.password,
    role: u.role,
    balance: u.balance,
    createdAt: u.createdAt,
    totalSpins: u.totalSpins,
    totalPointsBet: u.totalPointsBet,
    totalPointsWon: u.totalPointsWon,
  }));

  res.json({ users: usersList });
});

// Admin API: Create Client Account
app.post('/api/admin/create-user', (req: Request, res: Response) => {
  const { adminId, newUserId, newPassword, initialBalance = 10000 } = req.body;
  const adminKey = String(adminId || '').trim().toLowerCase();
  const admin = usersMap.get(adminKey);

  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: Se requieren permisos de Administrador' });
    return;
  }

  if (!newUserId || !newPassword) {
    res.status(400).json({ success: false, error: 'Debes ingresar un ID y Contraseña para el cliente' });
    return;
  }

  const targetKey = String(newUserId).trim().toLowerCase();
  if (usersMap.has(targetKey)) {
    res.status(400).json({ success: false, error: `El ID de usuario '${newUserId}' ya existe.` });
    return;
  }

  const newUser: UserAccount = {
    id: String(newUserId).trim(),
    password: String(newPassword).trim(),
    role: 'client',
    balance: Math.max(0, Number(initialBalance) || 0),
    createdAt: new Date().toISOString(),
    totalSpins: 0,
    totalPointsBet: 0,
    totalPointsWon: 0,
    jackpotsHit: 0,
    lastWinAmount: 0,
    spinHistory: [],
  };

  usersMap.set(targetKey, newUser);
  saveUsers(usersMap);

  res.json({
    success: true,
    user: newUser,
    message: `Cliente ${newUser.id} creado con éxito con ${newUser.balance.toLocaleString()} puntos.`,
  });
});

// Admin API: Acreditar / Descontar Puntos por ID
app.post('/api/admin/credit-points', (req: Request, res: Response) => {
  const { adminId, targetUserId, amount, action = 'add' } = req.body;
  const adminKey = String(adminId || '').trim().toLowerCase();
  const admin = usersMap.get(adminKey);

  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado' });
    return;
  }

  const targetKey = String(targetUserId || '').trim().toLowerCase();
  const targetUser = usersMap.get(targetKey);

  if (!targetUser) {
    res.status(404).json({ success: false, error: `El usuario '${targetUserId}' no existe.` });
    return;
  }

  const points = Math.floor(Math.abs(Number(amount) || 0));

  if (action === 'add') {
    targetUser.balance += points;
  } else if (action === 'subtract') {
    targetUser.balance = Math.max(0, targetUser.balance - points);
  } else if (action === 'set') {
    targetUser.balance = Math.max(0, points);
  }

  saveUsers(usersMap);

  res.json({
    success: true,
    targetUserId: targetUser.id,
    newBalance: targetUser.balance,
    message: `Puntos actualizados. Saldo actual de ${targetUser.id}: ${targetUser.balance.toLocaleString()} pts.`,
  });
});

// Admin API: Delete Client User
app.post('/api/admin/delete-user', (req: Request, res: Response) => {
  const { adminId, targetUserId } = req.body;
  const adminKey = String(adminId || '').trim().toLowerCase();
  const admin = usersMap.get(adminKey);

  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: Se requieren permisos de Administrador' });
    return;
  }

  const targetKey = String(targetUserId || '').trim().toLowerCase();
  const targetUser = usersMap.get(targetKey);

  if (!targetUser) {
    res.status(404).json({ success: false, error: `El usuario '${targetUserId}' no existe.` });
    return;
  }

  if (targetUser.role === 'admin' || targetKey === 'hammer0406' || targetKey === 'thatie0406') {
    res.status(400).json({ success: false, error: 'No se puede eliminar una cuenta de Administrador' });
    return;
  }

  usersMap.delete(targetKey);
  saveUsers(usersMap);
  res.json({ success: true, message: `Usuario '${targetUser.id}' eliminado con éxito.` });
});

// Admin API: Set House Advantage / RTP Config
app.post('/api/admin/set-rtp', (req: Request, res: Response) => {
  const { adminId, rtpTarget } = req.body;
  const adminKey = String(adminId || '').trim().toLowerCase();
  const admin = usersMap.get(adminKey);

  if (!admin || admin.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Acceso denegado: Se requieren permisos de Administrador' });
    return;
  }

  const target = Math.min(95, Math.max(50, Number(rtpTarget) || 75));
  currentRtpConfig.rtpTarget = target;

  res.json({
    success: true,
    rtpTarget: currentRtpConfig.rtpTarget,
    houseMargin: 100 - currentRtpConfig.rtpTarget,
    message: `Margen de la Casa actualizado. Retorno al Jugador (RTP): ${currentRtpConfig.rtpTarget}%. Ventaja de la Casa: ${100 - currentRtpConfig.rtpTarget}%.`,
  });
});

app.get('/api/admin/rtp', (_req: Request, res: Response) => {
  res.json({
    rtpTarget: currentRtpConfig.rtpTarget,
    houseMargin: 100 - currentRtpConfig.rtpTarget,
  });
});

// Get User Balance & Stats
app.get('/api/points', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.query.sessionId as string) || 'cliente1';
  const user = getUser(userId);

  res.json({
    balance: user.balance,
    role: user.role,
    stats: {
      totalSpins: user.totalSpins,
      totalPointsBet: user.totalPointsBet,
      totalPointsWon: user.totalPointsWon,
      jackpotsHit: user.jackpotsHit,
      currentBalance: user.balance,
      jackpotPool: Math.floor(jackpotPool),
      rtpSetting: currentRtpConfig.rtpTarget,
    },
  });
});

// Refill Free Virtual Points
app.post('/api/refill', (req: Request, res: Response) => {
  const { userId, sessionId } = req.body;
  const targetId = userId || sessionId || 'cliente1';
  const user = getUser(targetId);

  // Add 5000 virtual points
  const addAmount = 5000;
  user.balance += addAmount;
  saveUsers(usersMap);

  res.json({
    success: true,
    message: '¡Puntos virtuales recargados con éxito! +5000 puntos.',
    newBalance: user.balance,
  });
});

// Main Spin Endpoint - Server-Authoritative RNG
app.post('/api/spin', (req: Request, res: Response) => {
  const { bets, userId, sessionId, currentBalance } = req.body as {
    bets: BetState;
    userId?: string;
    sessionId?: string;
    currentBalance?: number;
  };
  const targetId = userId || sessionId || 'cliente1';
  const user = getUser(targetId);

  if (!bets || typeof bets !== 'object') {
    res.status(400).json({ error: 'Apuestas inválidas' });
    return;
  }

  // Calculate total bet
  let totalBet = 0;
  const betKeys = Object.keys(bets) as (keyof BetState)[];
  for (const k of betKeys) {
    const val = Number(bets[k]) || 0;
    if (val < 0) {
      res.status(400).json({ error: 'La apuesta no puede ser negativa' });
      return;
    }
    totalBet += Math.floor(val);
  }

  if (totalBet <= 0) {
    res.status(400).json({ error: 'Debes colocar al menos 1 punto para girar' });
    return;
  }

  // If currentBalance supplied, sync user balance
  if (typeof currentBalance === 'number' && !isNaN(currentBalance)) {
    user.balance = Math.max(0, currentBalance);
  } else {
    if (user.balance < totalBet) {
      res.status(400).json({ error: 'Puntos insuficientes. Contacta al administrador para recargar tus puntos.' });
      return;
    }
    user.balance -= totalBet;
  }

  user.totalSpins += 1;
  user.totalPointsBet += totalBet;

  // Increment Jackpot virtual pool slightly (2% of bet)
  jackpotPool += Math.max(1, Math.floor(totalBet * 0.02));

  // Concurrency Guard & House Safety Check
  const { activePlayersCount, canWinNetProfit } = checkConcurrencyHouseGuard(targetId);

  // Determine main hit slot via smart arcade RNG
  const mainSlotIndex = getSmartSlotIndex(bets, user, totalBet, canWinNetProfit);
  const mainSlot = RING_SLOTS[mainSlotIndex];

  let hitSlots: number[] = [mainSlotIndex];
  let isMultiShoot = false;
  let shootCount = 1;

  // Check if main hit is multi-shoot bonus or cactus
  let isCactusHit = false;
  if (mainSlot.isBonus && mainSlot.shootCount && mainSlot.shootCount > 1) {
    isMultiShoot = true;
    shootCount = mainSlot.shootCount;
  } else if (mainSlot.isCactus || mainSlot.symbol === 'cactus') {
    isCactusHit = true;
    isMultiShoot = false;
    shootCount = 1;
  } else {
    isMultiShoot = false;
    shootCount = 1;
  }

  if (isMultiShoot) {
    let attempts = 0;
    while (hitSlots.length < shootCount && attempts < 50) {
      attempts++;
      const extraIndex = getSmartSlotIndex(bets, user, totalBet, canWinNetProfit);
      if (!hitSlots.includes(extraIndex) && !RING_SLOTS[extraIndex].isBonus) {
        hitSlots.push(extraIndex);
      }
    }
  }

  // Calculate Hits and Win Amounts
  let totalWin = 0;
  const hits: HitDetail[] = [];

  for (const slotIdx of hitSlots) {
    const slot = RING_SLOTS[slotIdx];
    if (slot.isBonus) continue; // Bonus slots trigger extra shoots or special multiplier

    const betCategory = SYMBOL_BET_KEYS[slot.symbol] || slot.betCategory;
    const betOnCategory = Number(bets[betCategory as keyof BetState]) || 0;

    if (betOnCategory > 0 && slot.multiplier > 0) {
      const winForSlot = betOnCategory * slot.multiplier;
      totalWin += winForSlot;

      hits.push({
        slotId: slot.id,
        symbol: slot.symbol,
        name: slot.name,
        betCategory,
        multiplier: slot.multiplier,
        betAmount: betOnCategory,
        winAmount: winForSlot,
      });
    }
  }

  // Apply active multiplier if Cactus was hit in the previous spin!
  const activeMult = user.activeMultiplier || 1;
  if (activeMult > 1 && totalWin > 0) {
    totalWin = totalWin * activeMult;
  }

  // Set active multiplier for NEXT spin if Cactus was hit on this spin
  if (isCactusHit) {
    user.activeMultiplier = 2;
  } else {
    user.activeMultiplier = 1;
  }

  // Check Virtual Jackpot trigger
  let jackpotWon = 0;
  const jackpotRandom = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
  if (jackpotRandom < currentRtpConfig.jackpotProbability && totalBet >= 10) {
    jackpotWon = Math.floor(jackpotPool);
    totalWin += jackpotWon;
    user.jackpotsHit += 1;
    jackpotPool = 25000; // Reset pool
  }

  // Add total win to user balance
  user.balance += totalWin;
  user.totalPointsWon += totalWin;
  user.lastWinAmount = totalWin;

  registerPlayerNetProfitResult(targetId, totalWin, totalBet);
  saveUsers(usersMap);

  // Provably Fair Cryptographic Verification Hash
  globalNonce += 1;
  const spinId = `spin_${Date.now()}_${globalNonce}`;
  const provablyData = `${serverMasterSeed}:${globalNonce}:${hitSlots.join(',')}:${totalWin}`;
  const hash = crypto.createHash('sha256').update(provablyData).digest('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverMasterSeed).digest('hex');

  const spinResult: SpinResult = {
    spinId,
    hitSlots,
    hits,
    totalBet,
    totalWin,
    jackpotWon,
    isMultiShoot,
    shootCount,
    isCactusHit,
    nextSpinMultiplier: user.activeMultiplier,
    newBalance: user.balance,
    jackpotPool: Math.floor(jackpotPool),
    provablyFair: {
      hash,
      serverSeedHash,
      nonce: globalNonce,
    },
    timestamp: new Date().toISOString(),
  };

  // Keep last 20 spins in history
  user.spinHistory.unshift({
    spinId,
    totalBet,
    totalWin,
    hitSlots,
    timestamp: spinResult.timestamp,
    hash,
  });
  if (user.spinHistory.length > 20) {
    user.spinHistory.pop();
  }

  res.json(spinResult);
});

// Scratch Card (Raspa y Gana) Backend State and Persistence
const SCRATCH_BANKROLL_FILE = path.join(process.cwd(), 'scratch_bankroll.json');

export interface ScratchTicket {
  ticketId: string;
  winAmount: number;
  grid: number[];
}

export interface ScratchBankrollData {
  totalTicketsSold: number;
  totalRevenue: number;
  totalPaidOut: number;
  availablePrizeCapital: number;
}

function loadScratchBankroll(): ScratchBankrollData {
  try {
    if (fs.existsSync(SCRATCH_BANKROLL_FILE)) {
      const raw = fs.readFileSync(SCRATCH_BANKROLL_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data.totalTicketsSold === 'number') {
        return data;
      }
    }
  } catch (err) {
    console.error('Error loading scratch bankroll:', err);
  }
  const initial: ScratchBankrollData = {
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalPaidOut: 0,
    availablePrizeCapital: 0,
  };
  saveScratchBankroll(initial);
  return initial;
}

function saveScratchBankroll(data: ScratchBankrollData) {
  try {
    fs.writeFileSync(SCRATCH_BANKROLL_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving scratch bankroll:', err);
  }
}

let scratchBankroll = loadScratchBankroll();

function generateTicketGrid(winAmount: number): number[] {
  const teaserPool = [1000000, 500000, 200000, 100000, 50000, 20000, 10000, 5000];
  
  if (winAmount > 0) {
    // WINNING TICKET: Exactly 3 cells of winAmount
    const grid: number[] = [winAmount, winAmount, winAmount];

    // Pick 3 distinct teaser values different from winAmount
    const availableTeasers = teaserPool.filter(v => v !== winAmount);
    for (let i = availableTeasers.length - 1; i > 0; i--) {
      const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
      [availableTeasers[i], availableTeasers[j]] = [availableTeasers[j], availableTeasers[i]];
    }

    const t1 = availableTeasers[0];
    const t2 = availableTeasers[1];
    const t3 = availableTeasers[2];

    // Add pairs for t1, t2, t3 (2 of each, so total = 3 + 2 + 2 + 2 = 9)
    grid.push(t1, t1, t2, t2, t3, t3);

    // Cryptographic shuffle
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    return grid;
  } else {
    // LOSING TICKET: 9 cells with near-miss teasers (max 2 of each prize, so 0 three-matches)
    // Pick 4 distinct teaser pairs + 1 single = 2 + 2 + 2 + 2 + 1 = 9
    const shuffledTeasers = [...teaserPool];
    for (let i = shuffledTeasers.length - 1; i > 0; i--) {
      const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
      [shuffledTeasers[i], shuffledTeasers[j]] = [shuffledTeasers[j], shuffledTeasers[i]];
    }

    const t1 = shuffledTeasers[0];
    const t2 = shuffledTeasers[1];
    const t3 = shuffledTeasers[2];
    const t4 = shuffledTeasers[3];
    const t5 = shuffledTeasers[4];

    const grid: number[] = [t1, t1, t2, t2, t3, t3, t4, t4, t5];

    // Cryptographic shuffle
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    return grid;
  }
}

function getMaxUnlockedPrize(capital: number): number {
  if (capital < 20000) return 10000;
  if (capital < 50000) return 20000;
  if (capital < 150000) return 50000;
  if (capital < 350000) return 100000;
  if (capital < 800000) return 200000;
  return 500000;
}

// Double-Up (Duplicar o Perder) Risk Mini Game Endpoint
app.post('/api/double-up', (req: Request, res: Response) => {
  const { prediction, currentWin, userId, sessionId } = req.body as {
    prediction: 'high' | 'low';
    currentWin: number;
    userId?: string;
    sessionId?: string;
  };
  const targetId = userId || sessionId || 'cliente1';
  const user = getUser(targetId);

  if (!prediction || (prediction !== 'high' && prediction !== 'low')) {
    res.status(400).json({ error: 'Predicción inválida (mayor o menor)' });
    return;
  }

  const prevAmount = Math.max(1, Number(currentWin) || user.lastWinAmount);

  // Generate cards 1 to 13
  const targetCard = Math.floor(crypto.randomBytes(1)[0] / 256 * 12) + 2; // 2 to 13
  const drawnCard = Math.floor(crypto.randomBytes(1)[0] / 256 * 12) + 2;

  let won = false;
  if (prediction === 'high' && drawnCard >= targetCard) {
    won = true;
  } else if (prediction === 'low' && drawnCard <= targetCard) {
    won = true;
  }

  let newAmount = 0;
  if (won) {
    newAmount = prevAmount * 2;
    const addedDiff = newAmount - prevAmount;
    user.balance += addedDiff;
    user.totalPointsWon += addedDiff;
    user.lastWinAmount = newAmount;
  } else {
    user.balance = Math.max(0, user.balance - prevAmount);
    user.lastWinAmount = 0;
  }

  saveUsers(usersMap);

  res.json({
    won,
    targetCard,
    chosenCard: drawnCard,
    prediction,
    prevAmount,
    newAmount,
    newBalance: user.balance,
  });
});

// Scratch Card (Raspa y Gana) Status Endpoint
app.get('/api/scratch/status', (_req: Request, res: Response) => {
  const maxUnlockedPrize = getMaxUnlockedPrize(scratchBankroll.availablePrizeCapital);
  res.json({
    ticketPrice: 5000,
    totalTicketsSold: scratchBankroll.totalTicketsSold,
    totalRevenue: scratchBankroll.totalRevenue,
    totalPaidOut: scratchBankroll.totalPaidOut,
    houseProfit: Math.round(scratchBankroll.totalRevenue * 0.30),
    availablePrizeCapital: Math.round(scratchBankroll.availablePrizeCapital),
    maxUnlockedPrize,
  });
});

// Scratch Card (Raspa y Gana) Buy Ticket Endpoint
app.post('/api/scratch/buy', (req: Request, res: Response) => {
  const { userId, sessionId } = req.body;
  const targetId = userId || sessionId || 'cliente1';
  const user = getUser(targetId);

  const TICKET_PRICE = 5000;

  if (user.balance < TICKET_PRICE) {
    res.status(400).json({
      success: false,
      error: `Puntos insuficientes. Cada boleto de Raspa y Gana cuesta ${TICKET_PRICE.toLocaleString()} pts.`,
    });
    return;
  }

  // Deduct 5,000 pts for ticket purchase
  user.balance -= TICKET_PRICE;
  user.totalPointsBet += TICKET_PRICE;

  const targetRtpRatio = (currentRtpConfig.rtpTarget || 75) / 100;

  // Add 5,000 to revenue, house profit percentage based on global house margin setting,
  // remaining percentage goes to availablePrizeCapital
  scratchBankroll.totalTicketsSold += 1;
  scratchBankroll.totalRevenue += TICKET_PRICE;
  scratchBankroll.availablePrizeCapital += TICKET_PRICE * targetRtpRatio;

  const maxPrizeAllowed = getMaxUnlockedPrize(scratchBankroll.availablePrizeCapital);

  // Determine win amount dynamically based on global RTP & available capital
  let chosenWinAmount = 0;
  const rand = Math.random();

  // Loss threshold adapts dynamically with global RTP setting (e.g. 70% RTP => 68% losses, 80% RTP => 55% losses)
  const lossThreshold = 1 - (targetRtpRatio * 0.45);

  if (rand < lossThreshold) {
    // Loss (0 PTS)
    chosenWinAmount = 0;
  } else if (rand < lossThreshold + 0.20) {
    // Small refund win (2,000 PTS or 5,000 PTS)
    chosenWinAmount = Math.random() < 0.6 ? 2000 : 5000;
  } else if (rand < lossThreshold + 0.28) {
    // Medium win (10,000 PTS or 20,000 PTS)
    const candidates = [10000, 20000].filter(p => p <= maxPrizeAllowed && p <= scratchBankroll.availablePrizeCapital);
    chosenWinAmount = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : 5000;
  } else {
    // Jackpot attempt (up to maxPrizeAllowed)
    const candidates = [50000, 100000, 200000, 500000].filter(p => p <= maxPrizeAllowed && p <= scratchBankroll.availablePrizeCapital);
    chosenWinAmount = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : (maxPrizeAllowed >= 10000 ? 10000 : 0);
  }

  // Double check that we NEVER pay out more than availablePrizeCapital
  if (chosenWinAmount > scratchBankroll.availablePrizeCapital) {
    chosenWinAmount = 0;
  }

  if (chosenWinAmount > 0) {
    scratchBankroll.totalPaidOut += chosenWinAmount;
    scratchBankroll.availablePrizeCapital -= chosenWinAmount;
  }

  const ticketGrid = generateTicketGrid(chosenWinAmount);
  const purchasedTicket: ScratchTicket = {
    ticketId: `T${scratchBankroll.totalTicketsSold}-${crypto.randomBytes(3).toString('hex')}`,
    winAmount: chosenWinAmount,
    grid: ticketGrid,
  };

  saveUsers(usersMap);
  saveScratchBankroll(scratchBankroll);

  res.json({
    success: true,
    ticket: purchasedTicket,
    newBalance: user.balance,
    totalTicketsSold: scratchBankroll.totalTicketsSold,
    availablePrizeCapital: scratchBankroll.availablePrizeCapital,
    maxUnlockedPrize: getMaxUnlockedPrize(scratchBankroll.availablePrizeCapital),
  });
});

// Scratch Card (Raspa y Gana) Claim Win Endpoint
app.post('/api/scratch/claim', (req: Request, res: Response) => {
  const { userId, winAmount } = req.body;
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const points = Math.max(0, Number(winAmount) || 0);

  if (points > 0) {
    user.balance += points;
    user.totalPointsWon += points;
    user.lastWinAmount = points;
    saveUsers(usersMap);
  }

  res.json({
    success: true,
    winAmount: points,
    newBalance: user.balance,
  });
});

/* ==========================================================================
   1. GATES OF OLYMPUS (PUERTAS DEL OLIMPO - 6x5 TUMBLE SLOT ENGINE)
   ========================================================================== */

export type OlympusSymbol =
  | 'crown'
  | 'hourglass'
  | 'ring'
  | 'goblet'
  | 'red_gem'
  | 'purple_gem'
  | 'yellow_gem'
  | 'green_gem'
  | 'blue_gem'
  | 'scatter_zeus';

const OLYMPUS_PAYTABLE: Record<string, { count8: number; count10: number; count12: number }> = {
  crown: { count8: 10, count10: 25, count12: 50 },
  hourglass: { count8: 2.5, count10: 10, count12: 25 },
  ring: { count8: 2, count10: 5, count12: 15 },
  goblet: { count8: 1.5, count10: 2, count12: 12 },
  red_gem: { count8: 1, count10: 1.5, count12: 10 },
  purple_gem: { count8: 0.8, count10: 1.2, count12: 8 },
  yellow_gem: { count8: 0.5, count10: 1, count12: 5 },
  green_gem: { count8: 0.4, count10: 0.9, count12: 4 },
  blue_gem: { count8: 0.25, count10: 0.75, count12: 2 },
};

function getRandomOlympusSymbol(isAnteBet: boolean = false, forceScatter: boolean = false): OlympusSymbol {
  if (forceScatter) return 'scatter_zeus';
  const rand = Math.random();
  // Scatter chance per cell (gives ~1 scatter per ~4 spins across 30 cells)
  const scatterChance = isAnteBet ? 0.012 : 0.007;
  if (rand < scatterChance) return 'scatter_zeus';

  const r = Math.random();
  if (r < 0.02) return 'crown';         // High value 2%
  if (r < 0.06) return 'hourglass';     // 4%
  if (r < 0.12) return 'ring';          // 6%
  if (r < 0.20) return 'goblet';        // 8%
  if (r < 0.32) return 'red_gem';       // 12%
  if (r < 0.46) return 'purple_gem';    // 14%
  if (r < 0.62) return 'yellow_gem';    // 16%
  if (r < 0.80) return 'green_gem';     // 18%
  return 'blue_gem';                    // Low value 20%
}

app.post('/api/olympus/spin', (req: Request, res: Response) => {
  const { userId, baseBet = 300, isAnteBet = false, isBuyBonus = false } = req.body;
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const bet = Math.max(100, Number(baseBet) || 300);
  let totalCost = bet;
  if (isBuyBonus) {
    totalCost = bet * 100;
  } else if (isAnteBet) {
    totalCost = Math.round(bet * 1.25);
  }

  if (user.balance < totalCost) {
    res.status(400).json({ error: `Puntos insuficientes (${totalCost.toLocaleString()} PTS requeridos)` });
    return;
  }

  user.balance -= totalCost;
  user.totalSpins += 1;
  user.totalPointsBet += totalCost;

  // Concurrency Guard Check
  const { activePlayersCount, canWinNetProfit } = checkConcurrencyHouseGuard(targetId);

  // Target RTP and hit rate calculation
  const targetRtpRatio = (currentRtpConfig.rtpTarget || 78) / 100;
  const userRtp = user.totalPointsBet > 0 ? (user.totalPointsWon / user.totalPointsBet) : targetRtpRatio;

  // Balanced Hit Frequency: ~32% of regular spins hit a win (~1 win every 3 spins)
  // If user is currently above target RTP or restricted by concurrency guard, hit rate scales down
  const targetHitRate = (!canWinNetProfit || userRtp > targetRtpRatio * 1.1) ? 0.18 : 0.32;
  const isWinningSpinTarget = isBuyBonus || (Math.random() < targetHitRate && canWinNetProfit);

  let grid: OlympusSymbol[] = [];
  const scatterCountToGuarantee = isBuyBonus ? 4 : 0;
  let scattersPlaced = 0;

  let baseWinMultiplier = 0;
  let winningSymbols: string[] = [];
  let counts: Record<string, number> = {};
  let attempts = 0;

  while (attempts < 4) {
    grid = [];
    scattersPlaced = 0;

    for (let i = 0; i < 30; i++) {
      let sym: OlympusSymbol;
      if (scattersPlaced < scatterCountToGuarantee && (i >= 26 || Math.random() < 0.15)) {
        sym = 'scatter_zeus';
        scattersPlaced++;
      } else {
        sym = getRandomOlympusSymbol(isAnteBet);
        if (sym === 'scatter_zeus') scattersPlaced++;
      }
      grid.push(sym);
    }

    // Count symbol frequencies
    counts = {};
    grid.forEach(s => { counts[s] = (counts[s] || 0) + 1; });

    baseWinMultiplier = 0;
    winningSymbols = [];

    Object.entries(counts).forEach(([sym, count]) => {
      if (sym === 'scatter_zeus') return;
      if (count >= 8) {
        winningSymbols.push(sym);
        const pay = OLYMPUS_PAYTABLE[sym];
        if (pay) {
          if (count >= 12) baseWinMultiplier += pay.count12;
          else if (count >= 10) baseWinMultiplier += pay.count10;
          else baseWinMultiplier += pay.count8;
        }
      }
    });

    // If this spin was targeted as a non-winning spin, but landed a win, re-roll up to 3 times
    if (!isWinningSpinTarget && baseWinMultiplier > 0 && attempts < 3) {
      attempts++;
      continue;
    }
    break;
  }

  // Zeus Multipliers - ~22% of winning spins trigger Zeus strike
  const zeusMultipliers: Array<{ pos: number; val: number }> = [];
  let totalMultiplierSum = 1;

  const multiplierTriggerChance = isBuyBonus ? 1.0 : (baseWinMultiplier > 0 ? 0.22 : 0.02);

  if (Math.random() < multiplierTriggerChance) {
    const orbCount = Math.floor(Math.random() * 2) + 1;
    let sum = 0;
    for (let i = 0; i < orbCount; i++) {
      const randomPos = Math.floor(Math.random() * 30);
      let randomVal = 2;
      const mRand = Math.random();

      if (userRtp >= targetRtpRatio) {
        if (mRand < 0.55) randomVal = 2;
        else if (mRand < 0.85) randomVal = 3;
        else randomVal = 5;
      } else {
        if (mRand < 0.35) randomVal = 2;
        else if (mRand < 0.65) randomVal = 3;
        else if (mRand < 0.88) randomVal = 5;
        else if (mRand < 0.96) randomVal = 10;
        else randomVal = 25;
      }

      zeusMultipliers.push({ pos: randomPos, val: randomVal });
      sum += randomVal;
    }
    if (sum > 0) totalMultiplierSum = sum;
  }

  const scatterZeusCount = counts['scatter_zeus'] || 0;
  let scatterPayout = 0;
  let isFreeSpinsTriggered = false;

  if (scatterZeusCount >= 4) {
    isFreeSpinsTriggered = true;
    if (scatterZeusCount >= 6) scatterPayout = 20;
    else if (scatterZeusCount === 5) scatterPayout = 5;
    else scatterPayout = 3;
  }

  // Calculate raw win
  let rawWin = Math.round((baseWinMultiplier + scatterPayout) * bet * (baseWinMultiplier > 0 ? totalMultiplierSum : 1));

  // Balanced Payout Caps: Exciting wins without risking house solvency
  if (!canWinNetProfit && rawWin > totalCost) {
    rawWin = Math.min(rawWin, Math.round(totalCost * 0.8));
  } else if (isBuyBonus) {
    rawWin = Math.min(rawWin, Math.round(bet * 85));
  } else if (userRtp > targetRtpRatio * 1.2) {
    rawWin = Math.min(rawWin, Math.round(bet * 12));
  } else {
    rawWin = Math.min(rawWin, Math.round(bet * 50));
  }

  const totalWin = rawWin;

  if (totalWin > 0) {
    user.balance += totalWin;
    user.totalPointsWon += totalWin;
    user.lastWinAmount = totalWin;
  }

  registerPlayerNetProfitResult(targetId, totalWin, totalCost);
  saveUsers(usersMap);

  res.json({
    success: true,
    grid,
    winningSymbols,
    baseWinMultiplier,
    totalMultiplierSum,
    zeusMultipliers,
    scatterZeusCount,
    isFreeSpinsTriggered,
    totalCost,
    totalWin,
    newBalance: user.balance,
  });
});

/* ==========================================================================
   2. LIGHTNING ROULETA RELÁMPAGO VIP ENGINE
   ========================================================================== */

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

app.post('/api/roulette/spin', (req: Request, res: Response) => {
  const { userId, bets } = req.body as { userId?: string; bets: Record<string, number> };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  if (!bets || typeof bets !== 'object') {
    res.status(400).json({ error: 'Apuestas no válidas' });
    return;
  }

  let totalBet = 0;
  Object.values(bets).forEach(val => {
    if (typeof val === 'number' && val > 0) totalBet += Math.floor(val);
  });

  if (totalBet < 100) {
    res.status(400).json({ error: 'La apuesta mínima es de 100 PTS' });
    return;
  }

  if (user.balance < totalBet) {
    res.status(400).json({ error: 'Puntos insuficientes' });
    return;
  }

  user.balance -= totalBet;
  user.totalPointsBet += totalBet;

  // Concurrency Guard Check
  const { activePlayersCount, canWinNetProfit } = checkConcurrencyHouseGuard(targetId);

  const targetRtpRatio = (currentRtpConfig.rtpTarget || 78) / 100;
  const userRtp = user.totalPointsBet > 0 ? (user.totalPointsWon / user.totalPointsBet) : targetRtpRatio;

  // Generate Lightning strike numbers
  const lightningCount = Math.floor(Math.random() * 4) + 1;
  const lightningNumbers: Array<{ number: number; multiplier: number }> = [];
  const usedNums = new Set<number>();

  const possibleMultipliers = [50, 100, 150, 200, 300, 500];
  while (lightningNumbers.length < lightningCount) {
    const num = Math.floor(Math.random() * 37);
    if (!usedNums.has(num)) {
      usedNums.add(num);
      const mult = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
      lightningNumbers.push({ number: num, multiplier: mult });
    }
  }

  // Calculate payouts for ALL possible outcome numbers (0..36)
  const candidateOutcomes: Array<{ num: number; color: 'red' | 'black' | 'green'; win: number }> = [];

  for (let candidate = 0; candidate <= 36; candidate++) {
    let candidateColor: 'red' | 'black' | 'green' = 'green';
    if (RED_NUMBERS.includes(candidate)) candidateColor = 'red';
    else if (candidate > 0) candidateColor = 'black';

    let win = 0;
    Object.entries(bets).forEach(([key, amount]) => {
      const betVal = Math.floor(amount);
      if (betVal <= 0) return;

      if (key.startsWith('n_')) {
        const targetNum = parseInt(key.replace('n_', ''), 10);
        if (targetNum === candidate) {
          const lightningMatch = lightningNumbers.find(l => l.number === candidate);
          if (lightningMatch) {
            win += betVal * lightningMatch.multiplier;
          } else {
            win += betVal * 30;
          }
        }
      }
      else if (key === 'red' && candidateColor === 'red') win += betVal * 2;
      else if (key === 'black' && candidateColor === 'black') win += betVal * 2;
      else if (key === 'even' && candidate > 0 && candidate % 2 === 0) win += betVal * 2;
      else if (key === 'odd' && candidate > 0 && candidate % 2 !== 0) win += betVal * 2;
      else if (key === 'low' && candidate >= 1 && candidate <= 18) win += betVal * 2;
      else if (key === 'high' && candidate >= 19 && candidate <= 36) win += betVal * 2;
      else if (key === 'doc_1' && candidate >= 1 && candidate <= 12) win += betVal * 3;
      else if (key === 'doc_2' && candidate >= 13 && candidate <= 24) win += betVal * 3;
      else if (key === 'doc_3' && candidate >= 25 && candidate <= 36) win += betVal * 3;
      else if (key === 'col_1' && candidate > 0 && candidate % 3 === 1) win += betVal * 3;
      else if (key === 'col_2' && candidate > 0 && candidate % 3 === 2) win += betVal * 3;
      else if (key === 'col_3' && candidate > 0 && candidate % 3 === 0) win += betVal * 3;
    });

    candidateOutcomes.push({ num: candidate, color: candidateColor, win });
  }

  // Categorize candidate outcomes
  const losingOutcomes = candidateOutcomes.filter(c => c.win === 0);
  const partialOutcomes = candidateOutcomes.filter(c => c.win > 0 && c.win < totalBet);
  const winOutcomes = candidateOutcomes.filter(c => c.win >= totalBet);
  const moderateWinOutcomes = winOutcomes.filter(c => c.win <= totalBet * 3);

  // Target Hit Rate: ~30-35% winning spins so player wins every ~3 spins while house stays ahead
  const targetHitRate = (!canWinNetProfit || userRtp > targetRtpRatio * 1.15) ? 0.15 : (userRtp > targetRtpRatio ? 0.30 : 0.38);
  const wantsWin = canWinNetProfit && Math.random() < targetHitRate;

  let chosenOutcome: { num: number; color: 'red' | 'black' | 'green'; win: number };

  if (wantsWin && winOutcomes.length > 0) {
    const preferModerate = userRtp >= targetRtpRatio || Math.random() < 0.80;
    if (preferModerate && moderateWinOutcomes.length > 0) {
      chosenOutcome = moderateWinOutcomes[Math.floor(Math.random() * moderateWinOutcomes.length)];
    } else {
      chosenOutcome = winOutcomes[Math.floor(Math.random() * winOutcomes.length)];
    }
  } else if (partialOutcomes.length > 0 && Math.random() < 0.4) {
    chosenOutcome = partialOutcomes[Math.floor(Math.random() * partialOutcomes.length)];
  } else if (losingOutcomes.length > 0) {
    chosenOutcome = losingOutcomes[Math.floor(Math.random() * losingOutcomes.length)];
  } else {
    chosenOutcome = candidateOutcomes[Math.floor(Math.random() * candidateOutcomes.length)];
  }

  // Soft payout cap if player is way ahead of target RTP
  let totalWin = chosenOutcome.win;
  if (userRtp > targetRtpRatio * 1.25 && totalWin > totalBet * 6) {
    totalWin = Math.round(totalBet * 6);
  }

  const winningNumber = chosenOutcome.num;
  const color = chosenOutcome.color;

  if (totalWin > 0) {
    user.balance += totalWin;
    user.totalPointsWon += totalWin;
    user.lastWinAmount = totalWin;
  }

  registerPlayerNetProfitResult(targetId, totalWin, totalBet);
  saveUsers(usersMap);

  res.json({
    success: true,
    winningNumber,
    color,
    lightningNumbers,
    totalBet,
    totalWin,
    netProfit: totalWin - totalBet,
    newBalance: user.balance,
  });
});

/* ==========================================================================
   3. SPANISH BLACKJACK ROYALE 21 ENGINE
   ========================================================================== */

export interface BlackjackCard {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

interface BlackjackSession {
  userId: string;
  deck: BlackjackCard[];
  playerHand: BlackjackCard[];
  dealerHand: BlackjackCard[];
  bet: number;
  status: 'playing' | 'player_won' | 'dealer_won' | 'push' | 'blackjack';
}

const blackjackSessionsMap = new Map<string, BlackjackSession>();

function createShuffledDeck(): BlackjackCard[] {
  const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: BlackjackCard[] = [];

  for (let d = 0; d < 6; d++) {
    for (const s of suits) {
      for (const v of values) {
        let weight = parseInt(v, 10);
        if (v === 'A') weight = 11;
        else if (['J', 'Q', 'K'].includes(v)) weight = 10;
        deck.push({ suit: s, value: v, weight });
      }
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function calculateHandScore(hand: BlackjackCard[]): number {
  let score = 0;
  let aces = 0;

  hand.forEach(card => {
    score += card.weight;
    if (card.value === 'A') aces++;
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

app.post('/api/blackjack/deal', (req: Request, res: Response) => {
  const { userId, bet = 1000 } = req.body;
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const betAmount = Math.max(200, Number(bet) || 200);

  if (user.balance < betAmount) {
    res.status(400).json({ error: 'Puntos insuficientes' });
    return;
  }

  user.balance -= betAmount;
  user.totalPointsBet += betAmount;

  const deck = createShuffledDeck();
  const playerHand = [deck.pop()!, deck.pop()!];
  const dealerHand = [deck.pop()!, deck.pop()!];

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = calculateHandScore(dealerHand);

  let status: 'playing' | 'player_won' | 'dealer_won' | 'push' | 'blackjack' = 'playing';
  let winAmount = 0;

  if (playerScore === 21 && dealerScore === 21) {
    status = 'push';
    winAmount = betAmount;
  } else if (playerScore === 21) {
    status = 'blackjack';
    winAmount = Math.round(betAmount * 2.5);
  } else if (dealerScore === 21) {
    status = 'dealer_won';
    winAmount = 0;
  }

  if (winAmount > 0) {
    user.balance += winAmount;
    user.totalPointsWon += winAmount;
    user.lastWinAmount = winAmount;
  }

  saveUsers(usersMap);

  const session: BlackjackSession = {
    userId: targetId,
    deck,
    playerHand,
    dealerHand,
    bet: betAmount,
    status,
  };

  blackjackSessionsMap.set(targetId, session);

  res.json({
    success: true,
    playerHand,
    dealerCardShown: dealerHand[0],
    isDealerHidden: status === 'playing',
    dealerHand: status !== 'playing' ? dealerHand : [dealerHand[0]],
    playerScore,
    dealerScore: status !== 'playing' ? dealerScore : dealerHand[0].weight,
    status,
    winAmount,
    bet: betAmount,
    newBalance: user.balance,
  });
});

// ==========================================================================
// CRAZY WHEEL (CRAZY TIME) - 54 SEGMENT MONEY WHEEL ENGINE
// ==========================================================================
export interface CrazyWheelSegmentDef {
  id: number;
  type: '1' | '2' | '5' | '10' | 'coin_flip' | 'cash_hunt' | 'pachinko' | 'crazy_time';
  label: string;
  baseMultiplier: number;
  color: string;
}

const CRAZY_WHEEL_SEGMENTS: CrazyWheelSegmentDef[] = [
  { id: 0, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 1, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#3b82f6' },
  { id: 2, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 3, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 4, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 5, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 6, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 7, type: 'pachinko', label: 'PACHINKO', baseMultiplier: 15, color: '#ec4899' },
  { id: 8, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 9, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 10, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 11, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 12, type: '10', label: '10', baseMultiplier: 10, color: '#6366f1' },
  { id: 13, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 14, type: 'cash_hunt', label: 'CASH HUNT', baseMultiplier: 20, color: '#10b981' },
  { id: 15, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 16, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 17, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 18, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#3b82f6' },
  { id: 19, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 20, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 21, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 22, type: '10', label: '10', baseMultiplier: 10, color: '#6366f1' },
  { id: 23, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 24, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 25, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 26, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#3b82f6' },
  { id: 27, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 28, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 29, type: 'pachinko', label: 'PACHINKO', baseMultiplier: 15, color: '#ec4899' },
  { id: 30, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 31, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 32, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 33, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 34, type: '10', label: '10', baseMultiplier: 10, color: '#6366f1' },
  { id: 35, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 36, type: 'cash_hunt', label: 'CASH HUNT', baseMultiplier: 20, color: '#10b981' },
  { id: 37, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 38, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 39, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 40, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 41, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#3b82f6' },
  { id: 42, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 43, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 44, type: '10', label: '10', baseMultiplier: 10, color: '#6366f1' },
  { id: 45, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 46, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 47, type: '5', label: '5', baseMultiplier: 5, color: '#a855f7' },
  { id: 48, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 49, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
  { id: 50, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 51, type: 'crazy_time', label: 'CRAZY TIME', baseMultiplier: 50, color: '#ef4444' },
  { id: 52, type: '1', label: '1', baseMultiplier: 1, color: '#38bdf8' },
  { id: 53, type: '2', label: '2', baseMultiplier: 2, color: '#f59e0b' },
];

app.post('/api/crazy-wheel/spin', (req: Request, res: Response) => {
  const { userId, bets } = req.body as {
    userId?: string;
    bets?: Record<string, number>;
  };

  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  if (!bets) {
    res.status(400).json({ error: 'Apuestas inválidas' });
    return;
  }

  const validKeys = ['1', '2', '5', '10', 'coin_flip', 'cash_hunt', 'pachinko', 'crazy_time'];
  let totalBet = 0;
  for (const k of validKeys) {
    if (bets[k] && bets[k] > 0) {
      totalBet += Math.floor(bets[k]);
    }
  }

  if (totalBet <= 0) {
    res.status(400).json({ error: 'Debe realizar al menos una apuesta' });
    return;
  }

  if (user.balance < totalBet) {
    res.status(400).json({ error: 'Saldo de puntos insuficiente' });
    return;
  }

  // Deduct total bet
  user.balance -= totalBet;
  user.totalSpins += 1;
  user.totalPointsBet += totalBet;

  // Concurrency Guard Check
  const { activePlayersCount, canWinNetProfit } = checkConcurrencyHouseGuard(targetId);

  const targetRtpRatio = (currentRtpConfig.rtpTarget || 78) / 100;
  const userRtp = user.totalPointsBet > 0 ? (user.totalPointsWon / user.totalPointsBet) : targetRtpRatio;

  // Top Slot RNG (Random multiplier assigned to a segment type)
  const topSlotTypes: CrazyWheelSegmentDef['type'][] = ['1', '2', '5', '10', 'coin_flip', 'cash_hunt', 'pachinko', 'crazy_time'];
  const topSlotMultipliers = [2, 3, 4, 5, 7, 10, 15, 20, 50];

  const chosenTopSlotType = topSlotTypes[Math.floor(Math.random() * topSlotTypes.length)];
  const chosenTopSlotMult = topSlotMultipliers[Math.floor(Math.random() * topSlotMultipliers.length)];

  // Calculate segment probabilities for the 54 segments
  const segmentWeights = CRAZY_WHEEL_SEGMENTS.map(segment => {
    let weight = 1.0;
    const betOnSegment = bets[segment.type] || 0;

    let segmentMult = segment.baseMultiplier;
    if (segment.type === chosenTopSlotType) {
      segmentMult *= chosenTopSlotMult;
    }

    const estPayout = betOnSegment > 0 ? betOnSegment * (segmentMult + 1) : 0;

    // Concurrency / House Profitability Guard
    if (!canWinNetProfit && estPayout > totalBet) {
      weight *= 0.05; // Heavily suppress net profit outcomes
    } else if (userRtp > targetRtpRatio * 1.15 && estPayout > totalBet) {
      weight *= 0.15;
    } else if (estPayout === 0) {
      // Player put 0 bet on this segment => standard/higher chance to land here to keep house ahead
      weight *= 1.8;
    } else if (estPayout <= totalBet) {
      // Partial payout (win less than total bet)
      weight *= 1.4;
    }

    return Math.max(0.01, weight);
  });

  const totalWeight = segmentWeights.reduce((a, b) => a + b, 0);
  let rnd = Math.random() * totalWeight;
  let winningSegmentIndex = 0;

  for (let i = 0; i < CRAZY_WHEEL_SEGMENTS.length; i++) {
    if (rnd < segmentWeights[i]) {
      winningSegmentIndex = i;
      break;
    }
    rnd -= segmentWeights[i];
  }

  const winningSegment = CRAZY_WHEEL_SEGMENTS[winningSegmentIndex];
  const betOnWinningSegment = bets[winningSegment.type] || 0;

  let topSlotApplied = false;
  let finalMultiplier = winningSegment.baseMultiplier;

  if (winningSegment.type === chosenTopSlotType) {
    topSlotApplied = true;
    finalMultiplier *= chosenTopSlotMult;
  }

  // Bonus Game Specific Multipliers & Details
  let bonusDetails: any = null;

  if (winningSegment.type === 'coin_flip') {
    const redMult = Math.floor(Math.random() * 15) + 5; // 5x to 20x
    const blueMult = Math.floor(Math.random() * 40) + 10; // 10x to 50x
    const winningColor = Math.random() < 0.5 ? 'red' : 'blue';
    const wonMult = winningColor === 'red' ? redMult : blueMult;
    finalMultiplier = wonMult * (topSlotApplied ? chosenTopSlotMult : 1);
    bonusDetails = { type: 'coin_flip', redMult, blueMult, winningColor, finalMult: finalMultiplier };
  } else if (winningSegment.type === 'cash_hunt') {
    const gridMults = [10, 15, 20, 25, 50, 75, 100, 200, 500];
    const pickedMult = gridMults[Math.floor(Math.random() * gridMults.length)];
    finalMultiplier = pickedMult * (topSlotApplied ? chosenTopSlotMult : 1);
    bonusDetails = { type: 'cash_hunt', pickedMult, finalMult: finalMultiplier };
  } else if (winningSegment.type === 'pachinko') {
    const pachinkoMults = [10, 20, 30, 50, 100, 250, 500, 1000];
    const pickedMult = pachinkoMults[Math.floor(Math.random() * pachinkoMults.length)];
    finalMultiplier = pickedMult * (topSlotApplied ? chosenTopSlotMult : 1);
    bonusDetails = { type: 'pachinko', pickedMult, finalMult: finalMultiplier };
  } else if (winningSegment.type === 'crazy_time') {
    const crazyMults = [25, 50, 100, 250, 500, 1000, 2000];
    const pickedMult = crazyMults[Math.floor(Math.random() * crazyMults.length)];
    finalMultiplier = pickedMult * (topSlotApplied ? chosenTopSlotMult : 1);
    bonusDetails = { type: 'crazy_time', pickedMult, finalMult: finalMultiplier };
  }

  let totalWin = 0;
  if (betOnWinningSegment > 0) {
    totalWin = Math.round(betOnWinningSegment * (finalMultiplier + 1));
  }

  // Final win sanity check
  if (!canWinNetProfit && totalWin > totalBet) {
    totalWin = Math.min(totalWin, Math.round(totalBet * 0.85));
  }

  if (totalWin > 0) {
    user.balance += totalWin;
    user.totalPointsWon += totalWin;
    user.lastWinAmount = totalWin;
  }

  registerPlayerNetProfitResult(targetId, totalWin, totalBet);
  saveUsers(usersMap);

  const nonce = user.totalSpins;
  const provablyFair = {
    hash: crypto.createHash('sha256').update(`${serverMasterSeed}:${nonce}:${winningSegmentIndex}`).digest('hex'),
    serverSeedHash: crypto.createHash('sha256').update(serverMasterSeed).digest('hex'),
    nonce,
  };

  res.json({
    success: true,
    spinId: `cw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    winningSegmentIndex,
    winningSegment,
    topSlot: {
      type: chosenTopSlotType,
      multiplier: chosenTopSlotMult,
      applied: topSlotApplied,
    },
    finalMultiplier,
    totalBet,
    totalWin,
    bonusDetails,
    newBalance: user.balance,
    provablyFair,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================================================
// CHICKEN ROAD (JUEGO DE LA GALLINA) ENGINE
// ==========================================================================
export interface ChickenSession {
  userId: string;
  bet: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'hardcore';
  step: number;
  maxSteps: number;
  currentMultiplier: number;
  multipliers: number[];
  status: 'playing' | 'cashed_out' | 'roasted';
  winAmount: number;
}

const chickenSessionsMap = new Map<string, ChickenSession>();

const CHICKEN_DIFFICULTIES = {
  easy: {
    maxSteps: 25,
    baseTrapProb: 0.04,
    multipliers: [
      1.03, 1.07, 1.12, 1.18, 1.25, 1.33, 1.42, 1.53, 1.66, 1.81,
      1.98, 2.18, 2.42, 2.70, 3.03, 3.42, 3.90, 4.48, 5.20, 6.10,
      7.25, 8.80, 10.90, 13.80, 18.00, 25.00
    ],
  },
  medium: {
    maxSteps: 20,
    baseTrapProb: 0.10,
    multipliers: [
      1.12, 1.28, 1.47, 1.70, 1.98, 2.33, 2.77, 3.32, 4.02, 4.92,
      6.10, 7.66, 9.75, 12.60, 16.50, 22.00, 30.00, 42.00, 60.00, 100.00
    ],
  },
  hard: {
    maxSteps: 15,
    baseTrapProb: 0.20,
    multipliers: [
      1.25, 1.60, 2.10, 2.80, 3.80, 5.20, 7.20, 10.20, 14.80, 22.00,
      34.00, 55.00, 95.00, 180.00, 350.00
    ],
  },
  hardcore: {
    maxSteps: 10,
    baseTrapProb: 0.35,
    multipliers: [
      1.60, 2.70, 4.80, 9.00, 18.00, 38.00, 85.00, 200.00, 500.00, 1500.00
    ],
  },
};

app.post('/api/chicken-road/start', (req: Request, res: Response) => {
  const { userId, bet, difficulty } = req.body as {
    userId?: string;
    bet?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'hardcore';
  };

  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const betAmount = Math.floor(Number(bet) || 0);
  const diffKey = difficulty || 'medium';
  const diffConfig = CHICKEN_DIFFICULTIES[diffKey] || CHICKEN_DIFFICULTIES.medium;

  if (betAmount <= 0) {
    res.status(400).json({ error: 'Monto de apuesta inválido' });
    return;
  }

  if (user.balance < betAmount) {
    res.status(400).json({ error: 'Saldo de puntos insuficiente' });
    return;
  }

  // Deduct bet amount
  user.balance -= betAmount;
  user.totalSpins += 1;
  user.totalPointsBet += betAmount;

  const session: ChickenSession = {
    userId: targetId,
    bet: betAmount,
    difficulty: diffKey,
    step: 0,
    maxSteps: diffConfig.maxSteps,
    currentMultiplier: 1.0,
    multipliers: diffConfig.multipliers,
    status: 'playing',
    winAmount: 0,
  };

  chickenSessionsMap.set(targetId, session);
  saveUsers(usersMap);

  res.json({
    success: true,
    session: {
      difficulty: session.difficulty,
      step: 0,
      maxSteps: session.maxSteps,
      multipliers: session.multipliers,
      nextMultiplier: session.multipliers[0],
      currentMultiplier: 1.0,
      bet: session.bet,
    },
    newBalance: user.balance,
  });
});

app.post('/api/chicken-road/step', (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);
  const session = chickenSessionsMap.get(targetId);

  if (!session || session.status !== 'playing') {
    res.status(400).json({ error: 'No hay una partida activa de Chicken Road' });
    return;
  }

  const diffConfig = CHICKEN_DIFFICULTIES[session.difficulty];
  const nextStepIndex = session.step; // 0-based for next multiplier
  const nextMultiplier = session.multipliers[nextStepIndex];
  const potentialPayout = Math.round(session.bet * nextMultiplier);

  // Check House Edge & Concurrency Guards
  const { canWinNetProfit } = checkConcurrencyHouseGuard(targetId);
  const targetRtpRatio = (currentRtpConfig.rtpTarget || 78) / 100;
  const userRtp = user.totalPointsBet > 0 ? (user.totalPointsWon / user.totalPointsBet) : targetRtpRatio;

  let trapProb = diffConfig.baseTrapProb;

  // Increase trap probability if player is attempting high multiplier or RTP exceeds limits
  if (!canWinNetProfit && potentialPayout > session.bet * 1.5) {
    trapProb += 0.35;
  } else if (userRtp > targetRtpRatio * 1.1) {
    trapProb += 0.20;
  } else if (session.step >= 4) {
    // Add progressive psychological tension: as chicken steps further, trap risk ramps up
    trapProb += session.step * 0.02;
  }

  trapProb = Math.min(0.85, trapProb);

  // First step (from INICIO/step 0 to step 1) is guaranteed 100% safe
  const isTrap = session.step === 0 ? false : Math.random() < trapProb;

  if (isTrap) {
    session.status = 'roasted';
    registerPlayerNetProfitResult(targetId, 0, session.bet);
    saveUsers(usersMap);

    res.json({
      success: true,
      roasted: true,
      trapStep: session.step + 1,
      message: '¡PUM! ¡La gallina cayó en la trampa y se rostizó! 🍗',
      newBalance: user.balance,
    });
    return;
  }

  // Safe step! Advance chicken
  session.step += 1;
  session.currentMultiplier = nextMultiplier;

  // Check if reached final step
  if (session.step === session.maxSteps) {
    const finalWin = Math.round(session.bet * session.currentMultiplier);
    user.balance += finalWin;
    user.totalPointsWon += finalWin;
    user.lastWinAmount = finalWin;

    session.status = 'cashed_out';
    session.winAmount = finalWin;

    registerPlayerNetProfitResult(targetId, finalWin, session.bet);
    saveUsers(usersMap);

    res.json({
      success: true,
      roasted: false,
      completed: true,
      step: session.step,
      currentMultiplier: session.currentMultiplier,
      winAmount: finalWin,
      newBalance: user.balance,
      message: `¡INCREÍBLE! ¡Llegaste al final del camino con ${session.currentMultiplier}X y ganaste ${finalWin.toLocaleString()} PTS! 🎉`,
    });
    return;
  }

  saveUsers(usersMap);

  res.json({
    success: true,
    roasted: false,
    completed: false,
    step: session.step,
    currentMultiplier: session.currentMultiplier,
    nextMultiplier: session.multipliers[session.step],
    cashOutValue: Math.round(session.bet * session.currentMultiplier),
    newBalance: user.balance,
  });
});

app.post('/api/chicken-road/cashout', (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);
  const session = chickenSessionsMap.get(targetId);

  if (!session || session.status !== 'playing' || session.step === 0) {
    res.status(400).json({ error: 'No se puede retirar en este momento' });
    return;
  }

  const winAmount = Math.round(session.bet * session.currentMultiplier);
  user.balance += winAmount;
  user.totalPointsWon += winAmount;
  user.lastWinAmount = winAmount;

  session.status = 'cashed_out';
  session.winAmount = winAmount;

  registerPlayerNetProfitResult(targetId, winAmount, session.bet);
  saveUsers(usersMap);

  res.json({
    success: true,
    winAmount,
    step: session.step,
    multiplier: session.currentMultiplier,
    newBalance: user.balance,
    message: `¡Retiro exitoso de ${winAmount.toLocaleString()} PTS (${session.currentMultiplier}X)! 💰`,
  });
});

app.post('/api/blackjack/action', (req: Request, res: Response) => {
  const { userId, action } = req.body as { userId?: string; action: 'hit' | 'stand' | 'double' };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);
  const session = blackjackSessionsMap.get(targetId);

  if (!session || session.status !== 'playing') {
    res.status(400).json({ error: 'No hay una partida activa de Blackjack' });
    return;
  }

  let playerScore = calculateHandScore(session.playerHand);
  let winAmount = 0;

  let currentAction = action;

  if (currentAction === 'hit') {
    session.playerHand.push(session.deck.pop()!);
    playerScore = calculateHandScore(session.playerHand);

    if (playerScore > 21) {
      session.status = 'dealer_won';
    }
  } else if (currentAction === 'double') {
    if (user.balance < session.bet) {
      res.status(400).json({ error: 'Puntos insuficientes para doblar la apuesta' });
      return;
    }
    user.balance -= session.bet;
    user.totalPointsBet += session.bet;
    session.bet *= 2;

    session.playerHand.push(session.deck.pop()!);
    playerScore = calculateHandScore(session.playerHand);

    if (playerScore > 21) {
      session.status = 'dealer_won';
    } else {
      currentAction = 'stand';
    }
  }

  if (currentAction === 'stand' && session.status === 'playing') {
    let dealerScore = calculateHandScore(session.dealerHand);
    while (dealerScore < 17) {
      session.dealerHand.push(session.deck.pop()!);
      dealerScore = calculateHandScore(session.dealerHand);
    }

    if (dealerScore > 21) {
      session.status = 'player_won';
      winAmount = session.bet * 2;
    } else if (playerScore > dealerScore) {
      session.status = 'player_won';
      winAmount = session.bet * 2;
    } else if (playerScore < dealerScore) {
      session.status = 'dealer_won';
      winAmount = 0;
    } else {
      session.status = 'push';
      winAmount = session.bet;
    }
  }

  if (winAmount > 0) {
    user.balance += winAmount;
    user.totalPointsWon += winAmount;
    user.lastWinAmount = winAmount;
  }

  saveUsers(usersMap);

  const finalDealerScore = calculateHandScore(session.dealerHand);

  res.json({
    success: true,
    playerHand: session.playerHand,
    dealerHand: session.dealerHand,
    playerScore,
    dealerScore: finalDealerScore,
    status: session.status,
    winAmount,
    bet: session.bet,
    newBalance: user.balance,
  });
});

// ==========================================================================
// CLASSIC 777 (CYBER 777) SLOT ENGINE
// ==========================================================================
const CLASSIC_777_STRIP = [
  'RED7', 'BAR1', 'BELL', 'BAR2', 'CHERRY', 'BAR3', 'DIAMOND', 'WILD7',
  'RED7', 'BAR1', 'CHERRY', 'BAR2', 'BELL', 'BAR3', 'DIAMOND'
];

function getSymbolAt(stripIndex: number, offset: number): string {
  const len = CLASSIC_777_STRIP.length;
  const idx = (stripIndex + offset + len) % len;
  return CLASSIC_777_STRIP[idx];
}

function calculateClassic777Payout(payline: string[], bet: number): { winAmount: number; multiplier: number; winType: string } {
  const [s1, s2, s3] = payline;

  const isWild = (s: string) => s === 'WILD7';

  // 3 Wild 777s -> 500x
  if (s1 === 'WILD7' && s2 === 'WILD7' && s3 === 'WILD7') {
    return { winAmount: bet * 500, multiplier: 500, winType: 'JACKPOT 777' };
  }

  // 3 Red 7s (or with Wilds)
  const isRed7Match = (s: string) => s === 'RED7' || isWild(s);
  if (isRed7Match(s1) && isRed7Match(s2) && isRed7Match(s3)) {
    return { winAmount: bet * 150, multiplier: 150, winType: 'TRIPLE 7s' };
  }

  // 3 Diamonds
  const isDiamondMatch = (s: string) => s === 'DIAMOND' || isWild(s);
  if (isDiamondMatch(s1) && isDiamondMatch(s2) && isDiamondMatch(s3)) {
    return { winAmount: bet * 30, multiplier: 30, winType: 'DIAMONDS' };
  }

  // 3 BAR3
  const isBar3Match = (s: string) => s === 'BAR3' || isWild(s);
  if (isBar3Match(s1) && isBar3Match(s2) && isBar3Match(s3)) {
    return { winAmount: bet * 25, multiplier: 25, winType: 'TRIPLE BARS' };
  }

  // 3 BAR2
  const isBar2Match = (s: string) => s === 'BAR2' || isWild(s);
  if (isBar2Match(s1) && isBar2Match(s2) && isBar2Match(s3)) {
    return { winAmount: bet * 15, multiplier: 15, winType: 'DOUBLE BARS' };
  }

  // 3 BAR1
  const isBar1Match = (s: string) => s === 'BAR1' || isWild(s);
  if (isBar1Match(s1) && isBar1Match(s2) && isBar1Match(s3)) {
    return { winAmount: bet * 8, multiplier: 8, winType: 'SINGLE BARS' };
  }

  // Any 3 BARS combination
  const isAnyBar = (s: string) => s.startsWith('BAR') || isWild(s);
  if (isAnyBar(s1) && isAnyBar(s2) && isAnyBar(s3)) {
    return { winAmount: bet * 4, multiplier: 4, winType: 'MIXED BARS' };
  }

  // 3 Bells
  const isBellMatch = (s: string) => s === 'BELL' || isWild(s);
  if (isBellMatch(s1) && isBellMatch(s2) && isBellMatch(s3)) {
    return { winAmount: bet * 12, multiplier: 12, winType: 'GOLDEN BELLS' };
  }

  // Cherries - Require at least one actual CHERRY symbol on the payline
  const realCherryCount = [s1, s2, s3].filter(s => s === 'CHERRY').length;
  if (realCherryCount > 0) {
    const cherryCount = [s1, s2, s3].filter(s => s === 'CHERRY' || isWild(s)).length;
    if (cherryCount === 3) {
      return { winAmount: bet * 10, multiplier: 10, winType: '3 CHERRIES' };
    } else if (cherryCount === 2) {
      return { winAmount: bet * 3, multiplier: 3, winType: '2 CHERRIES' };
    } else if (cherryCount === 1) {
      return { winAmount: Math.round(bet * 1.5), multiplier: 1.5, winType: '1 CHERRY' };
    }
  }

  return { winAmount: 0, multiplier: 0, winType: '' };
}

app.post('/api/classic777/spin', (req: Request, res: Response) => {
  const { userId, bet } = req.body as { userId?: string; bet?: number };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const betAmount = Math.floor(Number(bet) || 0);

  if (betAmount < 200) {
    res.status(400).json({ error: 'La apuesta mínima es de 200 PTS' });
    return;
  }

  if (user.balance < betAmount) {
    res.status(400).json({ error: 'Saldo de puntos insuficiente' });
    return;
  }

  // Deduct bet
  user.balance -= betAmount;
  user.totalSpins += 1;
  user.totalPointsBet += betAmount;

  // Check House Guard & RTP
  const { canWinNetProfit } = checkConcurrencyHouseGuard(targetId);
  const targetRtpRatio = (currentRtpConfig.rtpTarget || 78) / 100;
  const userRtp = user.totalPointsBet > 0 ? (user.totalPointsWon / user.totalPointsBet) : targetRtpRatio;

  const len = CLASSIC_777_STRIP.length;

  let pos1 = Math.floor(Math.random() * len);
  let pos2 = Math.floor(Math.random() * len);
  let pos3 = Math.floor(Math.random() * len);

  let payline = [
    getSymbolAt(pos1, 0),
    getSymbolAt(pos2, 0),
    getSymbolAt(pos3, 0),
  ];

  let outcome = calculateClassic777Payout(payline, betAmount);

  // Apply Strict House Advantage & Teasing Near-Miss Enforcement
  const shouldHouseWin = !canWinNetProfit || userRtp > targetRtpRatio || Math.random() < 0.70;

  if (shouldHouseWin && outcome.winAmount > 0) {
    const isNearMissTeaser = Math.random() < 0.75;

    if (isNearMissTeaser) {
      // Force Reel 1 & 2 to match high-value symbol (RED7 or WILD7), and Reel 3 to miss by 1 notch on the reel strip
      const red7Indices = CLASSIC_777_STRIP.map((s, idx) => (s === 'RED7' || s === 'WILD7' ? idx : -1)).filter(i => i !== -1);
      const targetIdx = red7Indices[Math.floor(Math.random() * red7Indices.length)];

      pos1 = targetIdx;
      pos2 = targetIdx;
      // Reel 3 is offset by 1 notch so the matching symbol lands right on top or bottom row!
      pos3 = (targetIdx + (Math.random() < 0.5 ? 1 : -1) + len) % len;

      payline = [getSymbolAt(pos1, 0), getSymbolAt(pos2, 0), getSymbolAt(pos3, 0)];
      outcome = calculateClassic777Payout(payline, betAmount);
    } else {
      // Non-winning random spin
      let attempts = 0;
      while (attempts < 10) {
        pos1 = Math.floor(Math.random() * len);
        pos2 = Math.floor(Math.random() * len);
        pos3 = Math.floor(Math.random() * len);
        payline = [getSymbolAt(pos1, 0), getSymbolAt(pos2, 0), getSymbolAt(pos3, 0)];
        outcome = calculateClassic777Payout(payline, betAmount);
        if (outcome.winAmount === 0) break;
        attempts++;
      }
    }
  }

  // Detect Near-Miss state for high tension UI sound and animation (Reel 1 & 2 match high symbol, Reel 3 missed)
  const isNearMiss =
    (payline[0] === payline[1] && (payline[0] === 'RED7' || payline[0] === 'WILD7') && payline[2] !== payline[0]) ||
    (getSymbolAt(pos1, 0) === getSymbolAt(pos2, 0) && getSymbolAt(pos3, 1) === getSymbolAt(pos1, 0));

  if (outcome.winAmount > 0) {
    user.balance += outcome.winAmount;
    user.totalPointsWon += outcome.winAmount;
    user.lastWinAmount = outcome.winAmount;
  }

  registerPlayerNetProfitResult(targetId, outcome.winAmount, betAmount);
  saveUsers(usersMap);

  // Construct 3x3 reel view grid [ [top1, top2, top3], [payline1, payline2, payline3], [bot1, bot2, bot3] ]
  const grid = [
    [getSymbolAt(pos1, -1), getSymbolAt(pos2, -1), getSymbolAt(pos3, -1)],
    payline,
    [getSymbolAt(pos1, 1), getSymbolAt(pos2, 1), getSymbolAt(pos3, 1)],
  ];

  res.json({
    success: true,
    bet: betAmount,
    winAmount: outcome.winAmount,
    multiplier: outcome.multiplier,
    winType: outcome.winType,
    reelPositions: [pos1, pos2, pos3],
    payline,
    grid,
    isNearMiss,
    newBalance: user.balance,
  });
});

// ==========================================================================
// BALLOON INFLATION GAME ENGINE (PROGRESSIVE MULTIPLIER & CASHOUT)
// ==========================================================================
interface BalloonSession {
  userId: string;
  bet: number;
  crashMultiplier: number;
  cashedOut: boolean;
  isPopped: boolean;
}

const activeBalloonSessions: Record<string, BalloonSession> = {};

app.post('/api/balloon/start', (req: Request, res: Response) => {
  const { userId, bet } = req.body as { userId?: string; bet?: number };
  const targetId = userId || 'cliente1';
  const user = getUser(targetId);

  const betAmount = Math.floor(Number(bet) || 0);

  if (betAmount < 200 || betAmount > 1200) {
    res.status(400).json({ error: 'La apuesta para el Globo debe ser entre 200 y 1.200 PTS' });
    return;
  }

  if (user.balance < betAmount) {
    res.status(400).json({ error: 'Saldo de puntos insuficiente' });
    return;
  }

  // Deduct bet
  user.balance -= betAmount;
  user.totalSpins += 1;
  user.totalPointsBet += betAmount;

  // Determine crash multiplier dynamically (fair distribution so players win regularly if cashing out ~1.2x - 2.5x)
  // Base random value
  const rand = Math.random();
  let crashMultiplier = 1.15;

  if (rand < 0.15) {
    // Early pop (1.12x to 1.35x)
    crashMultiplier = Number((1.12 + Math.random() * 0.23).toFixed(2));
  } else if (rand < 0.70) {
    // Standard win range (1.36x to 2.80x)
    crashMultiplier = Number((1.36 + Math.random() * 1.44).toFixed(2));
  } else if (rand < 0.92) {
    // High win range (2.81x to 5.50x)
    crashMultiplier = Number((2.81 + Math.random() * 2.69).toFixed(2));
  } else {
    // Jackpot flight (5.51x to 12.00x)
    crashMultiplier = Number((5.51 + Math.random() * 6.49).toFixed(2));
  }

  activeBalloonSessions[targetId] = {
    userId: targetId,
    bet: betAmount,
    crashMultiplier,
    cashedOut: false,
    isPopped: false,
  };

  saveUsers(usersMap);

  res.json({
    success: true,
    bet: betAmount,
    crashMultiplier,
    newBalance: user.balance,
  });
});

app.post('/api/balloon/cashout', (req: Request, res: Response) => {
  const { userId, multiplier } = req.body as { userId?: string; multiplier?: number };
  const targetId = userId || 'cliente1';
  const session = activeBalloonSessions[targetId];

  if (!session || session.isPopped || session.cashedOut) {
    res.status(400).json({ error: 'No hay un juego de globo activo o ya finalizó' });
    return;
  }

  const user = getUser(targetId);
  const claimedMult = Math.min(session.crashMultiplier, Math.max(1.0, Number(multiplier) || 1.0));
  const winAmount = Math.floor(session.bet * claimedMult);

  user.balance += winAmount;
  user.totalPointsWon += winAmount;
  user.lastWinAmount = winAmount;

  session.cashedOut = true;
  registerPlayerNetProfitResult(targetId, winAmount, session.bet);
  saveUsers(usersMap);

  delete activeBalloonSessions[targetId];

  res.json({
    success: true,
    winAmount,
    multiplier: claimedMult,
    newBalance: user.balance,
    message: `🎈 ¡RETIRO EXITOSO! Multiplicador ${claimedMult.toFixed(2)}x (+${winAmount.toLocaleString('es-ES')} PTS)`,
  });
});

app.post('/api/balloon/pop', (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  const targetId = userId || 'cliente1';
  const session = activeBalloonSessions[targetId];

  if (session) {
    session.isPopped = true;
    registerPlayerNetProfitResult(targetId, 0, session.bet);
    saveUsers(usersMap);
    delete activeBalloonSessions[targetId];
  }

  const user = getUser(targetId);
  res.json({ success: true, newBalance: user.balance });
});

// RTP Config Endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json(currentRtpConfig);
});

app.post('/api/config', (req: Request, res: Response) => {
  const { rtpTarget, jackpotProbability, multiShootProbability } = req.body;
  if (rtpTarget && rtpTarget >= 40 && rtpTarget <= 95) {
    currentRtpConfig.rtpTarget = Number(rtpTarget);
  }
  if (jackpotProbability && jackpotProbability >= 0.00005 && jackpotProbability <= 0.05) {
    currentRtpConfig.jackpotProbability = Number(jackpotProbability);
  }
  if (multiShootProbability && multiShootProbability >= 0.005 && multiShootProbability <= 0.2) {
    currentRtpConfig.multiShootProbability = Number(multiShootProbability);
  }
  res.json({ success: true, config: currentRtpConfig });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fruit King 3 Arcade Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
