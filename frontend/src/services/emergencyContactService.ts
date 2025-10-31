// frontend/src/services/emergencyContactService.ts (New File)

import { apiClient } from './apiClient';
import { EmergencyContact, EmergencyContactCreate } from '../types/emergencyContact.types';

const API_ROUTE = '/emergency-contacts';

export const emergencyContactService = {
  /**
   * Fetches all emergency contacts for the current user.
   */
  async getContacts(): Promise<EmergencyContact[]> {
    console.log('[EmergencyContactService] Fetching contacts...');
    const response = await apiClient.get<EmergencyContact[]>(API_ROUTE);
    return response.data;
  },

  /**
   * Creates a new emergency contact.
   * @param data The contact creation data.
   */
  async createContact(data: EmergencyContactCreate): Promise<EmergencyContact> {
    console.log('[EmergencyContactService] Creating contact:', data.name);
    // Note: apiClient handles the JSON payload and backend Pydantic aliases
    const response = await apiClient.post<EmergencyContact>(API_ROUTE, data);
    return response.data;
  },

  /**
   * Deletes an emergency contact by its ID.
   * @param contactId The ID of the contact to delete.
   */
  async deleteContact(contactId: string): Promise<void> {
    console.log('[EmergencyContactService] Deleting contact:', contactId);
    await apiClient.delete(`${API_ROUTE}/${contactId}`);
  },
};