import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, linkWithCredential, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getFirestore, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp, updateDoc } from '@react-native-firebase/firestore';
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { googleWebClientId } from '../generated/firebase-client';
import { Profile, avatarPresets, errorMessage, normalizeProfile } from '../domain/profile';

const auth = getAuth(), db = getFirestore();
GoogleSignin.configure({ webClientId: googleWebClientId, offlineAccess: false });
type Pending = { credential: FirebaseAuthTypes.AuthCredential; email: string };
type Context = {
  user: FirebaseAuthTypes.User | null; ready: boolean; profile: Profile | null; profileError: string; profileLoading: boolean; busy: boolean; error: string; pendingEmail: string;
  login: (email: string, password: string) => Promise<void>; signup: (email: string, password: string, name: string) => Promise<void>;
  google: () => Promise<void>; logout: () => Promise<void>; cancelLink: () => Promise<void>; retry: () => void;
  save: (username: string, bio: string) => Promise<boolean>; setAvatar: (url: string) => Promise<boolean>;
};
const AuthContext = createContext<Context | null>(null);
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw Error('AuthProvider missing'); return context; };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null), [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null), [profileError, setProfileError] = useState(''), [profileLoading, setProfileLoading] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [pendingEmail, setPendingEmail] = useState(''), [retryKey, setRetryKey] = useState(0);
  const lock = useRef(false), pending = useRef<Pending | null>(null), signupName = useRef('');
  const activeUid = useRef<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, next => {
    const nextUid = next?.uid || null;
    if (activeUid.current !== nextUid) { setProfile(null); setProfileError(''); }
    activeUid.current = nextUid;
    setUser(next); setReady(true);
  }), []);

  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    const uid = user.uid, ref = doc(db, 'user_meta', uid);
    let alive = true, initializing = false;
    setProfileError(''); setProfileLoading(true);
    const timer = setTimeout(() => { if (alive) { setProfileLoading(false); setProfileError('Profile এখনো পাওয়া যায়নি। Internet/Firebase permission পরীক্ষা করে Retry করো।'); } }, 20000);
    const unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
      if (!alive) return;
      if (snapshot.exists()) {
        clearTimeout(timer); setProfile(normalizeProfile(uid, snapshot.data() || {})); setProfileLoading(false); setProfileError('');
      } else if (!snapshot.metadata.fromCache && !initializing) {
        initializing = true;
        // Initialize only a missing document. NEVER reset or backfill an existing account.
        runTransaction(db, async tx => {
          const existing = await tx.get(ref); if (existing.exists()) return;
          tx.set(ref, {
            uid, email: user.email || '', username: signupName.current.trim() || user.displayName || (user.email || 'hunter').split('@')[0],
            avatar: user.photoURL || avatarPresets[0], Bio: '', xp: 0, level: 1, gold: 0, gems: 0,
            inventoryCards: [], equippedSlots: {}, inventory: { themes: [] }, equippedTheme: '', tracker: [], recentChats: [], freeSpins: 0,
            pityRare: 0, pityLegendary: 0, permBonusAtk: 0, permBonusHp: 0, permBonusDef: 0, flatBonusAtk: 0, flatBonusHp: 0, flatBonusDef: 0,
            storyRulesShown: false, dungeonConqueror: false, last_claim_date: Timestamp.fromMillis(0), daily_read_count: 0, last_read_date: '',
            missionData: { date: '', progress: { newsRead: 0, postsCreated: 0, socialActions: 0, animeAdded: 0, communityActions: 0 }, claimed: { m_news: false, m_posts: false, m_social: false, m_tracker: false, m_community: false } },
            created_at: serverTimestamp(), updated_at: serverTimestamp(),
          });
        }).catch(e => { if (alive) { clearTimeout(timer); setProfileLoading(false); setProfileError(errorMessage(e)); } });
      }
    }, e => { if (alive) { clearTimeout(timer); setProfileLoading(false); setProfileError(errorMessage(e)); } });
    return () => { alive = false; clearTimeout(timer); unsubscribe(); };
  }, [user?.uid, retryKey]);

  const action = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await operation(); } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== statusCodes.SIGN_IN_CANCELLED && code !== statusCodes.IN_PROGRESS) setError(errorMessage(e));
    } finally { lock.current = false; setBusy(false); }
  };
  const login = (email: string, password: string) => action(async () => {
    const address = email.trim();
    if (pending.current && address.toLowerCase() !== pending.current.email.toLowerCase()) { setError('Google account-এর একই email দিয়ে existing account-এ login করো, অথবা Cancel করো।'); return; }
    const result = await signInWithEmailAndPassword(auth, address, password);
    if (pending.current) {
      if (result.user.email?.toLowerCase() !== pending.current.email.toLowerCase()) throw Error('Account mismatch');
      await linkWithCredential(result.user, pending.current.credential);
      pending.current = null; setPendingEmail('');
    }
  });
  const signup = (email: string, password: string, name: string) => action(async () => {
    signupName.current = name.trim();
    try { await createUserWithEmailAndPassword(auth, email.trim(), password); }
    finally { /* Keep name until initial snapshot creation has completed. */ }
  });
  const google = () => action(async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut();
    const response = await GoogleSignin.signIn(); if (!isSuccessResponse(response)) return;
    const token = response.data.idToken; if (!token) { setError('Google ID token পাওয়া যায়নি। আবার চেষ্টা করো।'); return; }
    const credential = GoogleAuthProvider.credential(token);
    const current = auth.currentUser;
    if (current) { await linkWithCredential(current, credential); setUser(auth.currentUser); return; }
    signupName.current = '';
    try { await signInWithCredential(auth, credential); }
    catch (e) {
      if ((e as { code?: string }).code === 'auth/account-exists-with-different-credential') {
        pending.current = { credential, email: response.data.user.email }; setPendingEmail(response.data.user.email);
        setError('এই email-এ existing account আছে। তার password দিয়ে login করলে Google নিরাপদে link হবে।');
      } else throw e;
    }
  });
  const logout = () => action(async () => {
    pending.current = null; setPendingEmail(''); signupName.current = '';
    await firebaseSignOut(auth); await GoogleSignin.signOut().catch(() => {});
    setProfile(null);
  });
  const cancelLink = async () => { pending.current = null; setPendingEmail(''); setError(''); if (auth.currentUser) await logout(); };
  const write = async (data: { username?: string; Bio?: string; avatar?: string }) => {
    if (!auth.currentUser || lock.current) return false;
    const uid = auth.currentUser.uid;
    lock.current = true; setBusy(true); setError('');
    try {
      await updateDoc(doc(db, 'user_meta', uid), { ...data, updated_at: serverTimestamp() });
      return activeUid.current === uid;
    } catch (e) { if (activeUid.current === uid) setError(errorMessage(e)); return false; }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async (username: string, bio: string) => { if (!username.trim()) { setError('Username ফাঁকা রাখা যাবে না।'); return false; } return write({ username: username.trim(), Bio: bio.trim() }); };
  const setAvatar = async (url: string) => write({ avatar: url });
  return <AuthContext.Provider value={{ user, ready, profile: profile?.uid === user?.uid ? profile : null, profileError, profileLoading, busy, error, pendingEmail, login, signup, google, logout, cancelLink, retry: () => setRetryKey(k => k + 1), save, setAvatar }}>{children}</AuthContext.Provider>;
}
