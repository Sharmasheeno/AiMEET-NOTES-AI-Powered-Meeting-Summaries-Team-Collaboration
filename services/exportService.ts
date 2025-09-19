/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import jsPDF from 'jspdf';
import { MeetingNotes } from '../types';

interface NoteData extends MeetingNotes {
    transcription: string;
    created_at: string;
}

// Function to create a downloadable file from text content
const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
};

// Generates a clean filename from the meeting date
const createFilename = (date: string, extension: string) => {
    return `Meeting-Notes-${new Date(date).toISOString().split('T')[0]}.${extension}`;
}

export const exportAsMarkdown = (note: NoteData): void => {
    const { summary, actionItems, keyDecisions, transcription, created_at } = note;
    const meetingDate = new Date(created_at).toLocaleString();

    let markdownContent = `# Meeting Notes - ${meetingDate}\n\n`;
    markdownContent += `## Summary\n${summary}\n\n`;

    if (actionItems.length > 0) {
        markdownContent += `## Action Items\n`;
        actionItems.forEach(item => {
            markdownContent += `- ${item}\n`;
        });
        markdownContent += `\n`;
    }

    if (keyDecisions.length > 0) {
        markdownContent += `## Key Decisions\n`;
        keyDecisions.forEach(item => {
            markdownContent += `- ${item}\n`;
        });
        markdownContent += `\n`;
    }

    markdownContent += `---\n\n## Full Transcription\n${transcription}`;

    const filename = createFilename(created_at, 'md');
    downloadFile(filename, markdownContent, 'text/markdown');
};

export const exportAsPdf = (note: NoteData): void => {
    const { summary, actionItems, keyDecisions, transcription, created_at } = note;
    const meetingDate = new Date(created_at).toLocaleString();
    const filename = createFilename(created_at, 'pdf');

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    const addSection = (title: string, content: string[] | string) => {
        if (currentY > 260) { // Check for page break before adding a new section
            doc.addPage();
            currentY = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, margin, currentY);
        currentY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        if (Array.isArray(content)) {
            content.forEach(item => {
                const lines = doc.splitTextToSize(`• ${item}`, pageWidth - (margin * 2));
                if (currentY + (lines.length * 6) > 280) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.text(lines, margin, currentY);
                currentY += (lines.length * 6);
            });
        } else {
            const lines = doc.splitTextToSize(content, pageWidth - (margin * 2));
            if (currentY + (lines.length * 5) > 280) {
                doc.addPage();
                currentY = margin;
            }
            doc.text(lines, margin, currentY);
            currentY += (lines.length * 5) + 5;
        }
        currentY += 5; // Add some space after the section
    };
    
    // Document Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Notes', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(meetingDate, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Add sections
    addSection('Summary', summary);
    if (actionItems.length > 0) {
        addSection('Action Items', actionItems);
    }
    if (keyDecisions.length > 0) {
        addSection('Key Decisions', keyDecisions);
    }

    // Add a divider
    doc.setDrawColor(200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    addSection('Full Transcription', transcription);
    
    doc.save(filename);
};