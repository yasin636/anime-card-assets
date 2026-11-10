import cards from './cards.json';

export type Card = { instanceId?: string; id: string; name?: string; image?: string; rarity?: string };
export type Profile = {
  uid: string; username: string; Bio: string; avatar: string; xp: number; gold: number; gems: number;
  pityRare: number; pityLegendary: number; themes: string[]; equippedTheme: string;
  inventoryCards: Card[]; equippedSlots: Record<string, Card>;
  permBonusAtk: number; permBonusHp: number; permBonusDef: number;
  flatBonusAtk: number; flatBonusHp: number; flatBonusDef: number;
};
export const avatarPresets = ['Gojo', 'Naruto', 'Levi', 'Luffy', 'Sukuna'].map(seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
export function levelInfo(raw: number) {
  let remaining = Math.max(0, Math.floor(Number(raw) || 0)), level = 1;
  const threshold = (lv: number) => lv <= 10 ? 50 : lv <= 20 ? 80 : lv <= 60 ? 300 : lv <= 80 ? 650 : lv <= 90 ? 850 : 1000;
  while (level < 100 && remaining >= threshold(level)) { remaining -= threshold(level); level++; }
  const title = level <= 10 ? 'Genin (Beginner)' : level <= 20 ? 'Hunter (Active)' : level <= 40 ? 'Captain (Legend)' : level <= 60 ? 'Captain (Legend OP)' : level <= 80 ? 'Master (Legend OP)' : level <= 90 ? 'Grandmaster (Boss Stage)' : 'Demon King (Boss)';
  return { level, title, into: level === 100 ? 0 : remaining, next: level === 100 ? 0 : threshold(level) };
}
export function normalizeProfile(uid: string, data: Record<string, unknown>): Profile {
  const number = (key: string) => Math.max(0, Number(data[key]) || 0);
  return {
    uid, username: String(data.username || 'Hunter'), Bio: String(data.Bio || ''), avatar: String(data.avatar || avatarPresets[0]),
    xp: number('xp'), gold: number('gold'), gems: number('gems'),
    pityRare: number('pityRare'), pityLegendary: number('pityLegendary'),
    themes: Array.isArray((data.inventory as {themes?:unknown})?.themes) ? (data.inventory as {themes:unknown[]}).themes.filter((v):v is string=>typeof v==='string') : [], equippedTheme: typeof data.equippedTheme==='string' ? data.equippedTheme : '',
    inventoryCards: Array.isArray(data.inventoryCards) ? data.inventoryCards : [],
    equippedSlots: data.equippedSlots && typeof data.equippedSlots === 'object' ? data.equippedSlots as Record<string, Card> : {},
    permBonusAtk: number('permBonusAtk'), permBonusHp: number('permBonusHp'), permBonusDef: number('permBonusDef'),
    flatBonusAtk: number('flatBonusAtk'), flatBonusHp: number('flatBonusHp'), flatBonusDef: number('flatBonusDef'),
  };
}
export function storyPower(profile: Profile) {
  const total = { hp: 0, atk: 0, def: 0 };
  for (const item of profile.inventoryCards) {
    const card = cards.find(c => c.id === item.id);
    if (card) { total.hp += card.hp; total.atk += card.atk; total.def += card.def; }
  }
  return {
    hp: Math.max(1, Math.round(total.hp * (1 + profile.permBonusHp / 100)) + profile.flatBonusHp),
    atk: Math.max(1, Math.round(total.atk * (1 + profile.permBonusAtk / 100)) + profile.flatBonusAtk),
    def: Math.max(1, Math.round(total.def * (1 + profile.permBonusDef / 100)) + profile.flatBonusDef),
  };
}
export function badge(gems: number) {
  return gems >= 2000 ? '🌈 Mythic Meta Hub' : gems >= 1000 ? '💎 Diamond Rinnegan' : gems >= 600 ? '❤️ Golden Shuriken' : gems >= 300 ? '⚔️ Silver Katana' : gems >= 100 ? '🗡️ Copper Kunai' : '';
}
export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email বা password সঠিক নয়।';
  if (code.includes('email-already-in-use')) return 'এই email-এ account আছে। Login করো।';
  if (code.includes('weak-password')) return 'Password অন্তত ৬ অক্ষরের হতে হবে।';
  if (code.includes('invalid-email')) return 'সঠিক email লিখো।';
  if (code.includes('network')) return 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করো।';
  if (code.includes('too-many-requests')) return 'অনেকবার চেষ্টা হয়েছে। একটু পরে আবার চেষ্টা করো।';
  if (code.includes('permission-denied') || code.includes('unauthorized')) return 'Firebase permission পাওয়া যায়নি। Screenshot দিয়ে জানাও; Rules নিজে খুলে দিও না।';
  if (code.includes('credential-already-in-use')) return 'এই Google account অন্য Firebase account-এ যুক্ত আছে। নিরাপত্তার জন্য merge করা হয়নি।';
  if (code.includes('requires-recent-login')) return 'আবার login করে চেষ্টা করো।';
  if (code === '12500' || code === '10' || code.includes('DEVELOPER_ERROR')) return 'Google configuration বা Play Services সমস্যা। Error code সহ জানাও।';
  if (code.includes('operation-not-allowed')) return 'এই login পদ্ধতি Firebase-এ চালু নেই।';
  return `কাজটি সম্পূর্ণ হয়নি। আবার চেষ্টা করো।${code ? ` (${code})` : ''}`;
}
