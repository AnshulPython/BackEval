/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatSession } from '../types';

/**
 * Converts a chat session to clean, readable Markdown format.
 */
export function formatChatAsMarkdown(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleString();
  let md = `# ${session.title}\n\n`;
  md += `- **Date**: ${dateStr}\n`;
  md += `- **Model**: ${session.model || 'Unknown'}\n`;
  md += `- **Provider**: ${session.provider || 'gemini'}\n`;
  md += `- **Messages**: ${session.messages.length}\n\n`;
  md += `---\n\n`;

  for (const msg of session.messages) {
    const roleTitle = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    md += `### ${roleTitle} (${time})\n\n`;

    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments: ${msg.attachments.map((a) => a.name).join(', ')}*\n\n`;
    }

    if (msg.thinking) {
      md += `<details>\n<summary>Thinking Process</summary>\n\n${msg.thinking}\n\n</details>\n\n`;
    }

    md += `${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      md += `**Sources:**\n`;
      for (const s of msg.sources) {
        md += `- [${s.title}](${s.url})\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

/**
 * Converts a chat session to plain text.
 */
export function formatChatAsText(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleString();
  let txt = `CHAT TITLE: ${session.title}\n`;
  txt += `DATE: ${dateStr}\n`;
  txt += `MODEL: ${session.model}\n`;
  txt += `PROVIDER: ${session.provider}\n`;
  txt += `==================================================\n\n`;

  for (const msg of session.messages) {
    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    txt += `[${role} - ${time}]\n`;
    txt += `${msg.content}\n\n`;
    txt += `--------------------------------------------------\n\n`;
  }

  return txt;
}

/**
 * Triggers a browser file download.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes a title string for use in filenames.
 */
function sanitizeFilename(title: string): string {
  return (
    title
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 40) || 'chat_export'
  );
}

/**
 * Exports a chat session as a Markdown (.md) file.
 */
export function exportChatMarkdown(session: ChatSession): void {
  const content = formatChatAsMarkdown(session);
  const filename = `${sanitizeFilename(session.title)}_${Date.now()}.md`;
  downloadFile(content, filename, 'text/markdown;charset=utf-8');
}

/**
 * Exports a chat session as a JSON (.json) file.
 */
export function exportChatJSON(session: ChatSession): void {
  const content = JSON.stringify(session, null, 2);
  const filename = `${sanitizeFilename(session.title)}_${Date.now()}.json`;
  downloadFile(content, filename, 'application/json;charset=utf-8');
}

/**
 * Exports a chat session as plain text (.txt) file.
 */
export function exportChatText(session: ChatSession): void {
  const content = formatChatAsText(session);
  const filename = `${sanitizeFilename(session.title)}_${Date.now()}.txt`;
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Copies formatted chat to the clipboard.
 */
export async function copyChatToClipboard(session: ChatSession): Promise<boolean> {
  try {
    const md = formatChatAsMarkdown(session);
    await navigator.clipboard.writeText(md);
    return true;
  } catch {
    return false;
  }
}
