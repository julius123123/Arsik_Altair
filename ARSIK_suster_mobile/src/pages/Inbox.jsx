import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { getPendingRequests, approveRequest, rejectRequest } from '../utils/caregiverApi';
import './Inbox.css';

function Inbox() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedRelation, setEditedRelation] = useState('');

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  useEffect(() => {
    loadPendingRequests();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadPendingRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    const { success, pending } = await getPendingRequests();
    if (success) {
      setPendingRequests(pending);
    }
    setLoading(false);
  };

  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `Approve ${editedName || request.name} as ${editedRelation || request.relation}?`
    );
    
    if (!confirmed) return;

    const result = await approveRequest(request.id, {
      name: editedName || request.name,
      relation: editedRelation || request.relation,
    });

    if (result.success) {
      alert(`✅ Approved: ${result.person.name} (${result.person.relation})`);
      setSelectedRequest(null);
      setEditedName('');
      setEditedRelation('');
      loadPendingRequests();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleReject = async (request) => {
    const confirmed = window.confirm(
      `Reject ${request.name}?`
    );
    
    if (!confirmed) return;

    const result = await rejectRequest(request.id, 'Rejected by caregiver');

    if (result.success) {
      alert(`❌ Rejected: ${request.name}`);
      setSelectedRequest(null);
      loadPendingRequests();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const selectRequest = (request) => {
    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null);
      setEditedName('');
      setEditedRelation('');
    } else {
      setSelectedRequest(request);
      setEditedName(request.name);
      setEditedRelation(request.relation);
    }
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <div className="inbox-header">
          <h2 className="page-title">Approval Requests</h2>
          <span className="inbox-badge">{pendingRequests.length} Pending</span>
        </div>

        {loading ? (
          <div className="loading-message">Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Pending Requests</h3>
            <p>All face recognition requests have been processed</p>
          </div>
        ) : (
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="request-item">
                <div 
                  className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                  onClick={() => selectRequest(request)}
                >
                  <img
                    src={request.imageData}
                    alt={request.name}
                    className="request-image"
                  />
                  <div className="request-info">
                    <h3 className="request-name">{request.name}</h3>
                    <p className="request-relation">{request.relation}</p>
                    <p className="request-time">
                      {new Date(request.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="badge-pending">PENDING</span>
                </div>

                {selectedRequest?.id === request.id && (
                  <div className="approval-form">
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        className="input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Edit name if needed"
                      />
                    </div>

                    <div className="form-group">
                      <label>Relation:</label>
                      <input
                        type="text"
                        className="input"
                        value={editedRelation}
                        onChange={(e) => setEditedRelation(e.target.value)}
                        placeholder="Edit relation if needed"
                      />
                    </div>

                    <div className="action-buttons">
                      <button
                        onClick={() => handleApprove(request)}
                        className="btn btn-approve"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="btn btn-reject"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="inbox" />
    </div>
  );
}

export default Inbox;
