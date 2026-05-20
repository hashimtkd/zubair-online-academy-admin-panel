import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db, IS_DEMO_MODE } from '../services/firebase';
import { getMockCollection, saveMockCollection } from '../utils/mockData';

// --- GENERIC DATABASE OPERATIONS ---

async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  if (IS_DEMO_MODE) {
    return getMockCollection<T>(collectionName);
  }

  if (!db) return [];
  const colRef = collection(db, collectionName);
  // Sort by createdAt desc by default if it exists
  const q = query(colRef, orderBy('createdAt', 'desc'));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (err) {
    // If orderby index is missing, fallback to unsorted fetch
    console.warn('Sorted query failed, falling back to unsorted fetch:', err);
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  }
}

async function fetchDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  if (IS_DEMO_MODE) {
    const list = getMockCollection<any>(collectionName);
    const found = list.find(item => item.id === docId);
    return found || null;
  }

  if (!db) return null;
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

async function addDocument<T extends { createdAt?: string }>(collectionName: string, data: any): Promise<T> {
  const dataWithTime = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString()
  };

  if (IS_DEMO_MODE) {
    const list = getMockCollection<any>(collectionName);
    const id = `${collectionName.slice(0, 4)}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = { id, ...dataWithTime };
    list.unshift(newItem);
    saveMockCollection(collectionName, list);
    return newItem as unknown as T;
  }

  if (!db) throw new Error('Firestore is not initialized');
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, dataWithTime);
  return { id: docRef.id, ...dataWithTime } as T;
}

async function updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
  const dataWithUpdate = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  if (IS_DEMO_MODE) {
    const list = getMockCollection<any>(collectionName);
    const index = list.findIndex(item => item.id === docId);
    if (index !== -1) {
      list[index] = { ...list[index], ...dataWithUpdate };
      saveMockCollection(collectionName, list);
    }
    return;
  }

  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, dataWithUpdate);
}

async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  if (IS_DEMO_MODE) {
    let list = getMockCollection<any>(collectionName);
    list = list.filter(item => item.id !== docId);
    saveMockCollection(collectionName, list);
    return;
  }

  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

async function bulkDeleteDocuments(collectionName: string, ids: string[]): Promise<void> {
  if (IS_DEMO_MODE) {
    let list = getMockCollection<any>(collectionName);
    list = list.filter(item => !ids.includes(item.id));
    saveMockCollection(collectionName, list);
    return;
  }

  if (!db) throw new Error('Firestore is not initialized');
  
  // Firestore batches have a limit of 500 operations
  const chunks = [];
  const tempIds = [...ids];
  while (tempIds.length > 0) {
    chunks.push(tempIds.splice(0, 450));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(id => {
      const docRef = doc(db, collectionName, id);
      batch.delete(docRef);
    });
    await batch.commit();
  }
}

// --- TANSTACK QUERY HOOKS ---

export function useCollectionQuery<T>(collectionName: string) {
  return useQuery<T[]>({
    queryKey: [collectionName],
    queryFn: () => fetchCollection<T>(collectionName),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}

export function useDocumentQuery<T>(collectionName: string, docId: string) {
  return useQuery<T | null>({
    queryKey: [collectionName, docId],
    queryFn: () => fetchDocument<T>(collectionName, docId),
    enabled: !!docId,
  });
}

export function useAddMutation<T extends { createdAt?: string }>(collectionName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => addDocument<T>(collectionName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
    }
  });
}

export function useUpdateMutation(collectionName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDocument(collectionName, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      queryClient.invalidateQueries({ queryKey: [collectionName, variables.id] });
    }
  });
}

export function useDeleteMutation(collectionName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(collectionName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
    }
  });
}

export function useBulkDeleteMutation(collectionName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteDocuments(collectionName, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
    }
  });
}

// --- SPECIAL SETTINGS API HOOKS ---

export function useAcademySettings() {
  const queryClient = useQueryClient();
  
  const queryData = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      if (IS_DEMO_MODE) {
        // Load settings from local storage
        const list = getMockCollection<any>('settings');
        if (list && !Array.isArray(list)) return list;
        return list[0] || getMockCollection<any>('settings');
      }
      if (!db) return null;
      const docRef = doc(db, 'settings', 'academy_settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (IS_DEMO_MODE) {
        localStorage.setItem('zoa_settings', JSON.stringify(data));
        return data;
      }
      if (!db) throw new Error('Firestore is not initialized');
      const docRef = doc(db, 'settings', 'academy_settings');
      await setDoc(docRef, data, { merge: true });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  return {
    settings: queryData.data,
    isLoading: queryData.isLoading,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending
  };
}
