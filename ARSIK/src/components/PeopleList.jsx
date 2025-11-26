import { useState, useEffect } from 'react';
import { getPeople, deletePerson, clearAllPeople } from '../utils/faceStorage';
import './PeopleList.css';

const PeopleList = ({ onUpdate }) => {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = () => {
    const data = getPeople();
    setPeople(data);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      deletePerson(id);
      loadPeople();
      if (onUpdate) onUpdate();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ This will delete ALL data and reset your patient ID. You will need to refresh the page. Continue?')) {
      clearAllPeople();
      // Show message and reload
      alert('✅ All data cleared! Page will reload now.');
      window.location.reload();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="people-list">
      <div className="list-header">
        <h2>Saved People ({people.length})</h2>
        {people.length > 0 && (
          <button onClick={handleClearAll} className="btn btn-clear">
            Clear All
          </button>
        )}
      </div>

      {people.length === 0 ? (
        <div className="empty-state">
          <p>No people saved yet.</p>
          <p className="hint">Start detection and the app will recognize faces automatically.</p>
        </div>
      ) : (
        <div className="people-grid">
          {people.map((person) => (
            <div
              key={person.id}
              className="person-card"
              onClick={() => setSelectedPerson(selectedPerson?.id === person.id ? null : person)}
            >
              <img src={person.imageData} alt={person.name} />
              <div className="person-info">
                <h3>{person.name}</h3>
                <p className="relation">{person.relation}</p>
                <p className="date">Last seen: {formatDate(person.lastSeen)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(person.id);
                }}
                className="btn-delete"
                title="Delete person"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedPerson && (
        <div className="person-modal" onClick={() => setSelectedPerson(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPerson(null)}>×</button>
            <img src={selectedPerson.imageData} alt={selectedPerson.name} />
            <div className="modal-info">
              <h2>{selectedPerson.name}</h2>
              <p><strong>Relation:</strong> {selectedPerson.relation}</p>
              <p><strong>Added:</strong> {formatDate(selectedPerson.addedDate)}</p>
              <p><strong>Last Seen:</strong> {formatDate(selectedPerson.lastSeen)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleList;
