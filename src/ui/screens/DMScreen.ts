/**
 * DMScreen - Direct message chat interface with NPCs
 * Phase 2: Romance Foundation
 */

import { BaseScreen } from '@/ui/BaseScreen';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { ConversationManager, DMMessage, ResponseOption } from '@/systems/ConversationManager';
import { NPCManager } from '@/systems/NPCManager';
import { NpcId } from '@/models/GameTypes';
import { getAssetPath, getPlayerPortraitPath } from '@/utils/AssetPaths';

export class DMScreen extends BaseScreen {
  private conversationManager!: ConversationManager;
  private npcManager!: NPCManager;
  private currentNpcId: NpcId | null = null;
  private messages: DMMessage[] = [];
  private availableResponses: ResponseOption[] = [];

  constructor(
    eventSystem: EventSystem,
    gameStateManager: GameStateManager
  ) {
    super('dm', eventSystem, gameStateManager, null as any);
  }

  override onShow(data?: { npcId: NpcId }): void {
    super.onShow();
    
    // Get systems from main game
    const systems = (window as any).game?.getSystems();
    if (systems) {
      this.conversationManager = systems.conversationManager;
      this.npcManager = systems.npcManager;
    }

    if (data?.npcId) {
      this.currentNpcId = data.npcId;
      this.loadConversation();
    }

    this.updateContent();
    this.eventSystem.emit('header:set_variant', { variant: 'dm', parentContext: 'cafe-hub' });
  }

  private loadConversation(): void {
    if (!this.currentNpcId || !this.conversationManager) return;

    const conversation = this.conversationManager.getConversation(this.currentNpcId);
    this.messages = conversation?.messages || [];
    this.availableResponses = this.conversationManager.getAvailableResponses(this.currentNpcId);

    // Mark conversation as read
    this.conversationManager.markConversationAsRead(this.currentNpcId);
  }

  protected override createContent(): string {
    if (!this.currentNpcId || !this.npcManager) {
      return this.createNPCListView();
    }

    const npc = this.npcManager.getNPC(this.currentNpcId);
    if (!npc) {
      return '<div class="error">NPC not found</div>';
    }

    if (!npc.unlockedFeatures.dms) {
      return this.createLockedView(npc.name);
    }

    return `
      <div class="dm-screen">
        <div class="dm-header">
          <div class="npc-info">
            <img src="${getAssetPath(npc.portraitPath)}" alt="${npc.name}" class="npc-avatar" />
            <div class="npc-details">
              <h2>${npc.name}</h2>
              <span class="bond-level">Bond Level ${npc.bondLevel}</span>
            </div>
          </div>
        </div>

        <div class="messages-container" id="messages-container">
          <div class="messages-list" id="messages-list">
            ${this.renderMessages()}
          </div>
        </div>

        <div class="response-area">
          <div class="quick-responses" id="quick-responses">
            ${this.renderResponseOptions()}
          </div>
        </div>
      </div>
    `;
  }

  private createNPCListView(): string {
    if (!this.npcManager) return '<div>Loading...</div>';

    const npcs = this.npcManager.getAllNPCs().filter(npc => npc.unlockedFeatures.dms);
    
    if (npcs.length === 0) {
      return `
        <div class="dm-screen">
          <div class="empty-state">
            <span class="material-icons empty-icon">chat_bubble_outline</span>
            <h3>No DMs Available</h3>
            <p>Reach Bond Level 2 with NPCs to unlock direct messaging!</p>
            <button class="btn btn-primary" data-navigate="cafe-hub">
              <span class="material-icons">arrow_back</span>
              Back to Café
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="dm-screen">
        <div class="dm-header">
          <h2>Direct Messages</h2>
        </div>
        
        <div class="npc-list">
          ${npcs.map(npc => this.renderNPCListItem(npc)).join('')}
        </div>
      </div>
    `;
  }

  private renderNPCListItem(npc: any): string {
    const conversation = this.conversationManager?.getConversation(npc.id);
    const unreadCount = conversation?.unreadCount || 0;
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    const lastMessageText = lastMessage ? 
      (lastMessage.content.length > 50 ? lastMessage.content.substring(0, 50) + '...' : lastMessage.content) : 
      'Start a conversation!';

    return `
      <div class="npc-list-item ${unreadCount > 0 ? 'has-unread' : ''}" data-npc-id="${npc.id}">
        <img src="${getAssetPath(npc.portraitPath)}" alt="${npc.name}" class="npc-avatar-small" />
        <div class="npc-info">
          <div class="npc-name">${npc.name}</div>
          <div class="last-message">${lastMessageText}</div>
        </div>
        ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
      </div>
    `;
  }

  private createLockedView(npcName: string): string {
    return `
      <div class="dm-screen">
        <div class="locked-state">
          <span class="material-icons locked-icon">lock</span>
          <h3>DMs Locked</h3>
          <p>Reach Bond Level 2 with ${npcName} to unlock direct messaging!</p>
          <button class="btn btn-primary" data-navigate="cafe-hub">
            <span class="material-icons">arrow_back</span>
            Back to Café
          </button>
        </div>
      </div>
    `;
  }

  private renderMessages(): string {
    if (this.messages.length === 0) {
      return `
        <div class="empty-messages">
          <span class="material-icons">chat</span>
          <p>Start the conversation!</p>
        </div>
      `;
    }

    return this.messages.map(message => this.renderMessage(message)).join('');
  }

  private renderMessage(message: DMMessage): string {
    const isPlayer = message.senderId === 'player';
    const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const avatarSrc = isPlayer ? 
      getAssetPath(getPlayerPortraitPath()) : 
      getAssetPath(this.npcManager?.getNPC(message.senderId as NpcId)?.portraitPath || '');

    return `
      <div class="message ${isPlayer ? 'player-message' : 'npc-message'}">
        <img src="${avatarSrc}" alt="${isPlayer ? 'You' : message.senderId}" class="message-avatar" />
        <div class="message-content">
          <div class="message-bubble">
            ${message.content}
          </div>
          <div class="message-time">${timestamp}</div>
        </div>
      </div>
    `;
  }

  private renderResponseOptions(): string {
    if (this.availableResponses.length === 0) {
      return '<div class="no-responses">No responses available</div>';
    }

    return this.availableResponses.map(response => `
      <button class="response-option" data-response-id="${response.id}">
        ${response.text}
      </button>
    `).join('');
  }

  protected override setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // NPC list item clicks
      const npcListItem = target.closest('.npc-list-item');
      if (npcListItem) {
        const npcId = npcListItem.getAttribute('data-npc-id') as NpcId;
        this.eventSystem.emit('ui:show_screen', {
          screenId: 'dm',
          data: { npcId }
        });
        return;
      }

      // Response option clicks
      const responseOption = target.closest('.response-option');
      if (responseOption) {
        const responseId = responseOption.getAttribute('data-response-id');
        const response = this.availableResponses.find(r => r.id === responseId);
        if (response && this.currentNpcId) {
          this.sendResponse(response);
        }
        return;
      }
    });

    // Listen for new messages
    this.eventSystem.on('dm:received', (data) => {
      if (data.npcId === this.currentNpcId) {
        this.loadConversation();
        this.updateContent();
        this.scrollToBottom();
      }
    });
  }

  private sendResponse(response: ResponseOption): void {
    if (!this.currentNpcId || !this.conversationManager) return;

    this.conversationManager.sendPlayerMessage(this.currentNpcId, response.text);
    
    // Reload conversation and update UI
    setTimeout(() => {
      this.loadConversation();
      this.updateContent();
      this.scrollToBottom();
    }, 100);
  }

  private scrollToBottom(): void {
    const messagesContainer = this.element.querySelector('#messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  protected generateStyles(): string {
    return `
      .dm-screen {
        display: flex;
        flex-direction: column;
        height: 100vh;
        max-width: 800px;
        margin: 0 auto;
        background: white;
      }

      .dm-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
      }

      .npc-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .npc-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
      }

      .npc-avatar-small {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .npc-details h2 {
        margin: 0;
        font-size: 1.2em;
        color: #333;
      }

      .bond-level {
        color: #666;
        font-size: 0.9em;
      }

      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f5f5f5;
      }

      .messages-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .message {
        display: flex;
        gap: 10px;
        max-width: 70%;
      }

      .player-message {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .npc-message {
        align-self: flex-start;
      }

      .message-avatar {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .message-content {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
      }

      .player-message .message-bubble {
        background: #8e44ad;
        color: white;
        border-bottom-right-radius: 6px;
      }

      .npc-message .message-bubble {
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 6px;
      }

      .message-time {
        font-size: 0.8em;
        color: #666;
        text-align: center;
      }

      .response-area {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        background: white;
      }

      .quick-responses {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .response-option {
        padding: 10px 16px;
        border: 2px solid #8e44ad;
        background: white;
        color: #8e44ad;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9em;
      }

      .response-option:hover {
        background: #8e44ad;
        color: white;
      }

      .npc-list {
        padding: 20px;
      }

      .npc-list-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        position: relative;
      }

      .npc-list-item:hover {
        background: #f0f0f0;
      }

      .npc-list-item.has-unread {
        background: #f8f4ff;
        border-left: 4px solid #8e44ad;
      }

      .npc-name {
        font-weight: 600;
        color: #333;
      }

      .last-message {
        color: #666;
        font-size: 0.9em;
        margin-top: 2px;
      }

      .unread-badge {
        position: absolute;
        right: 15px;
        background: #8e44ad;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
        font-weight: 600;
      }

      .empty-state, .locked-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        text-align: center;
        color: #666;
      }

      .empty-icon, .locked-icon {
        font-size: 4em;
        color: #ccc;
        margin-bottom: 20px;
      }

      .empty-messages {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #666;
        text-align: center;
      }

      .empty-messages .material-icons {
        font-size: 3em;
        color: #ccc;
        margin-bottom: 10px;
      }

      @media (max-width: 768px) {
        .dm-screen {
          height: 100vh;
        }
        
        .message {
          max-width: 85%;
        }
        
        .quick-responses {
          flex-direction: column;
        }
        
        .response-option {
          width: 100%;
          text-align: center;
        }
      }
    `;
  }
}
