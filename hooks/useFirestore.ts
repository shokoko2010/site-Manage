// hooks/useFirestore.ts
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const useFirestore = (collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  const addDocument = async (document: any) => {
    try {
      const docRef = await addDoc(collectionRef, document);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
      return null;
    }
  };

  const getDocuments = async () => {
    try {
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting documents: ", error);
      return [];
    }
  };

  return { addDocument, getDocuments };
};

export default useFirestore;
