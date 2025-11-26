// Storage utilities for saving and retrieving face data
const STORAGE_KEY = 'dementia_app_faces';

export const savePerson = (personData) => {
  try {
    const people = getPeople();
    const newPerson = {
      id: Date.now().toString(),
      name: personData.name,
      relation: personData.relation,
      descriptor: personData.descriptor, // Face embedding array
      imageData: personData.imageData, // Base64 image
      addedDate: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };
    
    people.push(newPerson);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    return newPerson;
  } catch (error) {
    console.error('Error saving person:', error);
    return null;
  }
};

export const getPeople = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting people:', error);
    return [];
  }
};

export const updateLastSeen = (personId) => {
  try {
    const people = getPeople();
    const person = people.find(p => p.id === personId);
    if (person) {
      person.lastSeen = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    }
  } catch (error) {
    console.error('Error updating last seen:', error);
  }
};

export const deletePerson = (personId) => {
  try {
    const people = getPeople();
    const filtered = people.filter(p => p.id !== personId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting person:', error);
    return false;
  }
};

export const clearAllPeople = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear patient ID to prevent re-syncing from server
    localStorage.removeItem('arsik_patient_id');
    console.log('⚠️ All local data cleared. Refresh page to generate new patient ID.');
    return true;
  } catch (error) {
    console.error('Error clearing people:', error);
    return false;
  }
};
