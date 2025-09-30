/**
 * ConversationHistoryScreen - Shows all NPC conversations
 * Allows selecting which NPC to chat with
 */

import { BaseScreen } from '@/ui/BaseScreen';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { ConversationManager, DMMessage } from '@/systems/ConversationManager';
import { NPCManager } from '@/systems/NPCManager';
import { NpcId } from '@/models/GameTypes';
// Asset paths are handled via npc.portraitPath

export class ConversationHistoryScreen extends BaseScreen {
  private conversationManager!: ConversationManager;
  private npcManager!: NPCManager;

  constructor(
    eventSystem: EventSystem,
    gameStateManager: GameStateManager
  ) {
    super('conversation-history', eventSystem, gameStateManager, null as any);
  }

  override onShow(): void {
    super.onShow();
    
    // Get systems from main game
    const systems = (window as any).game?.getSystems();
    if (systems) {
      this.conversationManager = systems.conversationManager;
      this.npcManager = systems.npcManager;
    }

    this.updateContent();
    this.eventSystem.emit('header:set_variant', { variant: 'conversation-history', parentContext: 'cafe-hub' });
  }

  protected override createContent(): string {
    return `
      <div class="conversation-history-screen">
        <div class="conversation-header">
          <h2>Messages</h2>
          <p class="conversation-subtitle">Choose who to chat with</p>
        </div>
        
        <div class="conversation-list">
          ${this.renderNPCConversations()}
        </div>
      </div>
    `;
  }

  private renderNPCConversations(): string {
    if (!this.npcManager) {
      return '<div class="no-conversations">Loading conversations...</div>';
    }

    const npcs = this.npcManager.getAllNPCs();
    if (!npcs || npcs.length === 0) {
      return '<div class="no-conversations">No NPCs available</div>';
    }

    return npcs.map(npc => {
      const conversation = this.conversationManager?.getConversation(npc.id as NpcId);
      const lastMessage = conversation?.messages[conversation.messages.length - 1];
      const unreadCount = conversation?.messages.filter(msg => !msg.read && msg.senderId !== 'player').length || 0;

      return `
        <div class="conversation-item" data-npc-id="${npc.id}">
          <div class="conversation-avatar">
            <img src="${npc.portraitPath}" alt="${npc.name}" />
            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
          </div>
          
          <div class="conversation-content">
            <div class="conversation-name">${npc.name}</div>
            <div class="conversation-preview">
              ${lastMessage ? this.formatMessagePreview(lastMessage) : 'Start a conversation...'}
            </div>
          </div>
          
          <div class="conversation-meta">
            ${lastMessage ? `<div class="conversation-time">${this.formatTime(lastMessage.timestamp)}</div>` : ''}
            <span class="material-icons conversation-arrow">chevron_right</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private formatMessagePreview(message: DMMessage): string {
    const prefix = message.senderId === 'player' ? 'You: ' : '';
    const content = message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content;
    return `${prefix}${content}`;
  }

  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

  protected override setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const conversationItem = (e.target as Element).closest('.conversation-item');
      if (conversationItem) {
        const npcId = conversationItem.getAttribute('data-npc-id') as NpcId;
        console.log(`🔍 Conversation item clicked, NPC ID: ${npcId}`);
        if (npcId) {
          console.log(`🗨️ Opening DM with ${npcId} from conversation history`);
          this.eventSystem.emit('ui:show_screen', {
            screenId: 'dm',
            data: { npcId }
          });
        } else {
          console.warn('⚠️ No NPC ID found on conversation item');
        }
      }
    });
  }

  protected getHeaderVariant(): string {
    return 'conversation-history';
  }

  protected generateStyles(): string {
    return `
      .conversation-history-screen {
        padding: 24px;
        max-width: 600px;
        margin: 0 auto;
      }

      .conversation-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .conversation-header h2 {
        font-size: 28px;
        font-weight: bold;
        color: #2c3e50;
        margin: 0 0 8px 0;
      }

      .conversation-subtitle {
        color: #7f8c8d;
        font-size: 16px;
        margin: 0;
      }

      .conversation-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .conversation-item {
        display: flex;
        align-items: center;
        padding: 16px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
      }

      .conversation-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        border-color: #e17497;
      }

      .conversation-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        margin-right: 16px;
        flex-shrink: 0;
      }

      .conversation-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .unread-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }

      .conversation-content {
        flex: 1;
        min-width: 0;
      }

      .conversation-name {
        font-weight: bold;
        font-size: 16px;
        color: #2c3e50;
        margin-bottom: 4px;
      }

      .conversation-preview {
        color: #7f8c8d;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conversation-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }

      .conversation-time {
        font-size: 12px;
        color: #95a5a6;
      }

      .conversation-arrow {
        color: #bdc3c7;
        font-size: 20px;
      }

      .no-conversations {
        text-align: center;
        padding: 48px 24px;
        color: #7f8c8d;
        font-size: 16px;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .conversation-history-screen {
          padding: 16px;
        }

        .conversation-item {
          padding: 12px;
        }

        .conversation-avatar {
          width: 40px;
          height: 40px;
          margin-right: 12px;
        }

        .conversation-name {
          font-size: 15px;
        }

        .conversation-preview {
          font-size: 13px;
        }
      }
    `;
  }
}
