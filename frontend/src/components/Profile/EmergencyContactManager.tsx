// frontend/src/components/Profile/EmergencyContactManager.tsx (New File)

import React, { useState, useEffect } from 'react';
import { emergencyContactService } from '../../services/emergencyContactService';
import { EmergencyContact, EmergencyContactCreate } from '../../types/emergencyContact.types';

// Styles (Inline for simplicity, mimicking existing React code style)
const managerStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '24px',
  background: 'white',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  borderTop: '1px solid #e5e7eb',
};

const inputStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  width: '100%',
};

/**
 * Manages the user's list of emergency contacts on the Profile Page.
 */
const EmergencyContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState<EmergencyContactCreate>({ name: '', phoneNumber: '', relationshipType: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Fetch contacts from the backend
  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emergencyContactService.getContacts();
      setContacts(data);
    } catch (err: any) {
      setError('Failed to load emergency contacts.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phoneNumber) {
      setError('Name and Phone Number are required.');
      return;
    }
    setIsAdding(true);
    setError(null);
    try {
      await emergencyContactService.createContact(newContact);
      setNewContact({ name: '', phoneNumber: '', relationshipType: '' });
      await loadContacts();
    } catch (err: any) {
      // Extract specific error message from the backend response
      const detail = err.response?.data?.detail || 'Failed to add contact.';
      setError(detail);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;
    try {
      await emergencyContactService.deleteContact(id);
      loadContacts();
    } catch (err: any) {
      setError('Failed to delete contact.');
    }
  };

  return (
    <div style={managerStyle}>
      <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: '0 0 16px 0', fontWeight: 700 }}>
        Emergency Contacts
      </h2>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fc8181' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading contacts...</p>
      ) : (
        <>
          {/* Display existing contacts */}
          {contacts.length === 0 ? (
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>No emergency contacts set up yet. Add one below!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {contacts.map(contact => (
                <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #eee', borderRadius: '8px', background: '#f9fafb' }}>
                  <div>
                    <strong>{contact.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563', marginLeft: '8px' }}>({contact.relationshipType || 'General'})</span><br />
                    <span style={{ color: '#1f2937', fontSize: '1rem', fontWeight: 500 }}>{contact.phoneNumber}</span>
                  </div>
                  <button onClick={() => handleDelete(contact.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Contact Form */}
          <h4 style={{ fontSize: '1.1rem', color: '#1f2937', margin: '0 0 10px 0', fontWeight: 600 }}>Add New Contact</h4>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              name="name"
              placeholder="Contact Name (e.g., Jane Doe)"
              value={newContact.name}
              onChange={handleChange}
              style={inputStyle}
              disabled={isAdding}
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number (e.g., 555-1234)"
              value={newContact.phoneNumber}
              onChange={handleChange}
              style={inputStyle}
              disabled={isAdding}
            />
             <input
              type="text"
              name="relationshipType"
              placeholder="Relationship (Optional, e.g., Family, Friend)"
              value={newContact.relationshipType || ''}
              onChange={handleChange}
              style={inputStyle}
              disabled={isAdding}
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isAdding ? 0.7 : 1
            }} disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Contact'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default EmergencyContactManager;