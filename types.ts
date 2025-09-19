/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface MeetingNotes {
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
}

// FIX: Add the missing 'Product' interface, which is used by ObjectCard and ProductSelector components.
export interface Product {
  id: string | number;
  name: string;
  imageUrl: string;
}
