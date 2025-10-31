// frontend/src/types/emergencyContact.types.ts (New File)

/**
 * Interface for an emergency contact record retrieved from the API.
 */
export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string; // Must be camelCase for Pydantic alias
  relationshipType?: string; // Must be camelCase for Pydantic alias
}

/**
 * Interface for the request body when creating a new emergency contact.
 */
export interface EmergencyContactCreate {
  name: string;
  phoneNumber: string;
  relationshipType?: string;
}