import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generic Firestore entity helper that mirrors the base44 SDK API:
 *   Entity.list(sortField, maxCount)
 *   Entity.filter(conditions, sortField, maxCount)
 *   Entity.create(data)
 *   Entity.update(id, data)
 *   Entity.delete(id)
 *   Entity.get(id)
 */
function createEntity(collectionName) {
  const col = collection(db, collectionName);

  return {
    async list(sortField = "-created_date", maxCount = 100) {
      try {
        const field = sortField.startsWith("-") ? sortField.slice(1) : sortField;
        const direction = sortField.startsWith("-") ? "desc" : "asc";
        const q = query(col, orderBy(field, direction), limit(maxCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        // Fallback without ordering if index not ready
        const snapshot = await getDocs(col);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    },

    async filter(conditions = {}, sortField = "-created_date", maxCount = 100) {
      try {
        const field = sortField.startsWith("-") ? sortField.slice(1) : sortField;
        const direction = sortField.startsWith("-") ? "desc" : "asc";
        const constraints = Object.entries(conditions).map(([k, v]) => where(k, "==", v));
        const q = query(col, ...constraints, orderBy(field, direction), limit(maxCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        // Fallback without ordering
        const constraints = Object.entries(conditions).map(([k, v]) => where(k, "==", v));
        const q = query(col, ...constraints, limit(maxCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    },

    async create(data) {
      const payload = {
        ...data,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const docRef = await addDoc(col, payload);
      return { id: docRef.id, ...payload };
    },

    async update(id, data) {
      const ref = doc(db, collectionName, id);
      const payload = { ...data, updated_date: new Date().toISOString() };
      await updateDoc(ref, payload);
      return { id, ...payload };
    },

    async delete(id) {
      const ref = doc(db, collectionName, id);
      await deleteDoc(ref);
      return { id };
    },

    async get(id) {
      const ref = doc(db, collectionName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    },
  };
}

// All collections matching the original Base44 entities
export const entities = {
  Application: createEntity("applications"),
  Deliverable: createEntity("deliverables"),
  Dispute: createEntity("disputes"),
  Escrow: createEntity("escrows"),
  Message: createEntity("messages"),
  Milestone: createEntity("milestones"),
  Notification: createEntity("notifications"),
  Review: createEntity("reviews"),
  SkillVerification: createEntity("skill_verifications"),
  Task: createEntity("tasks"),
  UserProfile: createEntity("user_profiles"),
};
