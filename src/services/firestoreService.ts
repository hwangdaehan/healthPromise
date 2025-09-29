import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SampleData {
  id?: string;
  message: string;
  timestamp: Date;
  userId?: string;
}

export interface Medicine {
  dataId?: string;
  isNoti: boolean;
  name: string;
  quantity: string;
  times: string[];
  userId: string;
}

export class FirestoreService {
  private static readonly COLLECTION_NAME = 'sampleData';

  static async addSampleData(data: Omit<SampleData, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...data,
        timestamp: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  static async getSampleData(): Promise<SampleData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as SampleData[];
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  static async updateSampleData(id: string, data: Partial<SampleData>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteSampleData(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // 약물 관련 함수들
  static async addMedicine(data: Omit<Medicine, 'dataId'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'medicine'), {
        ...data,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding medicine:', error);
      throw error;
    }
  }

  static async getMedicinesByUserId(userId: string): Promise<Medicine[]> {
    try {
      const q = query(collection(db, 'medicine'), where('userId', '==', userId));

      const querySnapshot = await getDocs(q);

      const medicines = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          dataId: doc.id,
          ...data,
        } as Medicine;
      });

      return medicines;
    } catch (error) {
      console.error('Error getting medicines:', error);
      throw error;
    }
  }

  static async getMedicineById(medicineId: string): Promise<Medicine | null> {
    try {
      const docRef = doc(db, 'medicine', medicineId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        dataId: docSnap.id,
        ...data,
      } as Medicine;
    } catch (error) {
      console.error('Error getting medicine by ID:', error);
      return null;
    }
  }

  static async updateMedicine(dataId: string, data: Partial<Medicine>): Promise<void> {
    try {
      const docRef = doc(db, 'medicine', dataId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw error;
    }
  }

  static async deleteMedicine(dataId: string): Promise<void> {
    try {
      const docRef = doc(db, 'medicine', dataId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  }
}
