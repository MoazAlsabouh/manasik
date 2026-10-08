import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// نحن نستخدم Collection واحدة كما طلبت لأن المشروع شخصي ولا يحتاج تسجيل دخول متعدد
const READINGS_COLLECTION = 'sugar_readings';
const PROFILE_DOC = 'user_profile';

export const saveReading = async (readingValue, isFasting, note = '') => {
  try {
    const docRef = await addDoc(collection(db, READINGS_COLLECTION), {
      value: readingValue,
      isFasting: isFasting,
      note: note,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving reading: ", error);
    return { success: false, error };
  }
};

export const getReadings = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, READINGS_COLLECTION), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const readings = [];
    querySnapshot.forEach((doc) => {
      readings.push({ id: doc.id, ...doc.data() });
    });
    return readings;
  } catch (error) {
    console.error("Error getting readings: ", error);
    return [];
  }
};

export const updateReading = async (id, data) => {
  try {
    await setDoc(doc(db, READINGS_COLLECTION, id), data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating reading: ", error);
    return { success: false, error };
  }
};

export const saveProfile = async (profileData) => {
  try {
    await setDoc(doc(db, 'settings', PROFILE_DOC), profileData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving profile: ", error);
    return { success: false, error };
  }
};

export const getProfile = async () => {
  try {
    const docRef = doc(db, 'settings', PROFILE_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting profile: ", error);
    return null;
  }
};
