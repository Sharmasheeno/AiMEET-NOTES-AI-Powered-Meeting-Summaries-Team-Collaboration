/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface MeetingNotes {
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
}

// FIX: Add missing Product interface.
export interface Product {
  id: string | number;
  name: string;
  imageUrl: string;
}
