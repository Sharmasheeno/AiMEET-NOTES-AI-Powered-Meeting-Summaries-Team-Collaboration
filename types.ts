/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface MeetingNotes {
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
}

export interface Product {
  id: string | number;
  name: string;
  imageUrl: string;
}
