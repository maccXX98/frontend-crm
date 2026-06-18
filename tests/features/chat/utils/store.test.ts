import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChatStore } from '@/features/chat/utils/store';
import { initialConversations } from '@/features/chat/utils/data';
import type { Attachment, Message } from '@/features/chat/utils/types';

describe('chat store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T10:30:00'));
    useChatStore.setState({
      conversations: initialConversations.map((c) => ({ ...c, messages: [...c.messages] })),
      selectedConversationId: initialConversations[0]?.id ?? '',
      draft: '',
      replyCursor: Object.fromEntries(initialConversations.map((c) => [c.id, 0]))
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('has 3 conversations with expected ids', () => {
      const { conversations } = useChatStore.getState();
      expect(conversations).toHaveLength(3);
      expect(conversations.map((c) => c.id)).toEqual(['billing-issue', 'api-integration', 'account-access']);
    });

    it('selectedConversationId defaults to first conversation id', () => {
      const { selectedConversationId } = useChatStore.getState();
      expect(selectedConversationId).toBe('billing-issue');
    });

    it('draft is empty string', () => {
      const { draft } = useChatStore.getState();
      expect(draft).toBe('');
    });

    it('replyCursor initialized to 0 for each conversation', () => {
      const { replyCursor } = useChatStore.getState();
      expect(replyCursor['billing-issue']).toBe(0);
      expect(replyCursor['api-integration']).toBe(0);
      expect(replyCursor['account-access']).toBe(0);
    });
  });

  describe('selectConversation', () => {
    it('sets selectedConversationId to the new id', () => {
      useChatStore.getState().selectConversation('api-integration');
      expect(useChatStore.getState().selectedConversationId).toBe('api-integration');
    });

    it('sets unread to 0 for the selected conversation', () => {
      useChatStore.getState().selectConversation('account-access');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'account-access');
      expect(conv?.unread).toBe(0);
    });

    it('leaves unread of other conversations untouched', () => {
      // billing-issue starts with unread: 2, api-integration with unread: 0
      useChatStore.getState().selectConversation('api-integration');
      const billing = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      expect(billing?.unread).toBe(2);
    });

    it('selecting a non-existent id sets selected but no conversation matches in map', () => {
      const stateBefore = useChatStore.getState().conversations.map((c) => ({ id: c.id, unread: c.unread }));
      useChatStore.getState().selectConversation('non-existent-id');
      const stateAfter = useChatStore.getState().conversations.map((c) => ({ id: c.id, unread: c.unread }));
      expect(stateAfter).toEqual(stateBefore);
    });
  });

  describe('setDraft', () => {
    it('updates draft string', () => {
      useChatStore.getState().setDraft('Hello there');
      expect(useChatStore.getState().draft).toBe('Hello there');
    });

    it('empty string clears draft', () => {
      useChatStore.setState({ draft: 'some text' });
      useChatStore.getState().setDraft('');
      expect(useChatStore.getState().draft).toBe('');
    });

    it('whitespace is preserved', () => {
      useChatStore.getState().setDraft('  hello  ');
      expect(useChatStore.getState().draft).toBe('  hello  ');
    });
  });

  describe('sendMessage', () => {
    it('creates message with sender user and author You', () => {
      useChatStore.getState().sendMessage('Test message');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.sender).toBe('user');
      expect(msg?.author).toBe('You');
    });

    it('trims the text', () => {
      useChatStore.getState().sendMessage('  Trimmed message  ');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.text).toBe('Trimmed message');
    });

    it('message has timestamp via toLocaleTimeString', () => {
      useChatStore.getState().sendMessage('Test');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      // With fake time set to 10:30:00, toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) = '10:30 AM'
      expect(msg?.timestamp).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)?$/i);
    });

    it('message id starts with outgoing-', () => {
      useChatStore.getState().sendMessage('Test');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.id).toMatch(/^outgoing-/);
    });

    it('appends to selected conversation messages', () => {
      const beforeCount = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue')?.messages.length ?? 0;
      useChatStore.getState().sendMessage('New message');
      const afterCount = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue')?.messages.length ?? 0;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('sets unread to 0 for selected conversation', () => {
      useChatStore.getState().sendMessage('Test');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      expect(conv?.unread).toBe(0);
    });

    it('resets draft to empty string', () => {
      useChatStore.setState({ draft: 'some draft' });
      useChatStore.getState().sendMessage('Test');
      expect(useChatStore.getState().draft).toBe('');
    });

    it('without attachments: message.attachments is undefined', () => {
      useChatStore.getState().sendMessage('Test');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.attachments).toBeUndefined();
    });

    it('with attachments (non-empty): message.attachments equals the array', () => {
      const attachments: Attachment[] = [{ id: 'att-1', name: 'file.pdf', size: 1024, type: 'application/pdf' }];
      useChatStore.getState().sendMessage('Test', attachments);
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.attachments).toEqual(attachments);
    });

    it('with empty attachments array: message.attachments is undefined', () => {
      useChatStore.getState().sendMessage('Test', []);
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg?.attachments).toBeUndefined();
    });

    it('multiple sendMessage calls append in order', () => {
      useChatStore.getState().sendMessage('First');
      useChatStore.getState().sendMessage('Second');
      useChatStore.getState().sendMessage('Third');
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      const lastThree = conv?.messages.slice(-3).map((m) => m.text);
      expect(lastThree).toEqual(['First', 'Second', 'Third']);
    });

    it('other conversations messages unchanged after sendMessage', () => {
      const apiMessagesBefore = useChatStore.getState().conversations.find((c) => c.id === 'api-integration')?.messages.length ?? 0;
      useChatStore.getState().sendMessage('Test');
      const apiMessagesAfter = useChatStore.getState().conversations.find((c) => c.id === 'api-integration')?.messages.length ?? 0;
      expect(apiMessagesAfter).toBe(apiMessagesBefore);
    });
  });

  describe('addIncomingMessage', () => {
    it('appends the incoming message to the target conversation', () => {
      const beforeCount = useChatStore.getState().conversations.find((c) => c.id === 'api-integration')?.messages.length ?? 0;
      const incoming: Message = {
        id: 'incoming-1',
        sender: 'contact',
        author: 'Support',
        text: 'How can I help?',
        timestamp: '10:30'
      };
      useChatStore.getState().addIncomingMessage('api-integration', incoming);
      const afterCount = useChatStore.getState().conversations.find((c) => c.id === 'api-integration')?.messages.length ?? 0;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('if conversation is selected: unread stays 0', () => {
      // billing-issue is selected, ensure it has unread: 0 then add message
      useChatStore.setState({ selectedConversationId: 'billing-issue' });
      useChatStore.getState().selectConversation('billing-issue'); // resets unread to 0
      const incoming: Message = { id: 'incoming-2', sender: 'contact', author: 'Support', text: 'Reply', timestamp: '10:31' };
      useChatStore.getState().addIncomingMessage('billing-issue', incoming);
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue');
      expect(conv?.unread).toBe(0);
    });

    it('if conversation is not selected: unread increments by 1', () => {
      // account-access has unread: 1 initially, is NOT selected (billing-issue is)
      const before = useChatStore.getState().conversations.find((c) => c.id === 'account-access')?.unread ?? 0;
      const incoming: Message = { id: 'incoming-3', sender: 'contact', author: 'Support', text: 'Reply', timestamp: '10:32' };
      useChatStore.getState().addIncomingMessage('account-access', incoming);
      const after = useChatStore.getState().conversations.find((c) => c.id === 'account-access')?.unread ?? 0;
      expect(after).toBe(before + 1);
    });

    it('other conversations unchanged after addIncomingMessage', () => {
      const beforeBilling = useChatStore.getState().conversations.find((c) => c.id === 'billing-issue')?.messages.length ?? 0;
      const beforeAccount = useChatStore.getState().conversations.find((c) => c.id === 'account-access')?.messages.length ?? 0;
      const incoming: Message = { id: 'incoming-4', sender: 'contact', author: 'Support', text: 'Reply', timestamp: '10:33' };
      useChatStore.getState().addIncomingMessage('api-integration', incoming);
      expect(useChatStore.getState().conversations.find((c) => c.id === 'billing-issue')?.messages.length ?? 0).toBe(beforeBilling);
      expect(useChatStore.getState().conversations.find((c) => c.id === 'account-access')?.messages.length ?? 0).toBe(beforeAccount);
    });

    it('message object shape is preserved', () => {
      const incoming: Message = {
        id: 'incoming-5',
        sender: 'contact',
        author: 'Agent',
        text: 'Your issue has been resolved',
        timestamp: '10:34',
        attachments: [{ id: 'att-1', name: 'receipt.pdf', size: 512, type: 'application/pdf' }]
      };
      useChatStore.getState().addIncomingMessage('api-integration', incoming);
      const conv = useChatStore.getState().conversations.find((c) => c.id === 'api-integration');
      const msg = conv?.messages[conv.messages.length - 1];
      expect(msg).toMatchObject({
        id: 'incoming-5',
        sender: 'contact',
        author: 'Agent',
        text: 'Your issue has been resolved',
        timestamp: '10:34'
      });
      expect(msg?.attachments).toHaveLength(1);
    });
  });

  describe('advanceReplyCursor', () => {
    it('increments the cursor for that conversation by 1', () => {
      useChatStore.getState().advanceReplyCursor('billing-issue');
      expect(useChatStore.getState().replyCursor['billing-issue']).toBe(1);
    });

    it('starts from 0 and increments correctly', () => {
      expect(useChatStore.getState().replyCursor['billing-issue']).toBe(0);
      useChatStore.getState().advanceReplyCursor('billing-issue');
      expect(useChatStore.getState().replyCursor['billing-issue']).toBe(1);
    });

    it('multiple calls: 0 → 1 → 2', () => {
      useChatStore.getState().advanceReplyCursor('billing-issue');
      useChatStore.getState().advanceReplyCursor('billing-issue');
      expect(useChatStore.getState().replyCursor['billing-issue']).toBe(2);
    });

    it('other conversations cursors unchanged', () => {
      useChatStore.getState().advanceReplyCursor('billing-issue');
      expect(useChatStore.getState().replyCursor['api-integration']).toBe(0);
      expect(useChatStore.getState().replyCursor['account-access']).toBe(0);
    });

    it('initial cursor for new conversation id starts at 0 then becomes 1', () => {
      // non-existent conversation starts at undefined (treated as 0)
      useChatStore.getState().advanceReplyCursor('new-conversation-id');
      expect(useChatStore.getState().replyCursor['new-conversation-id']).toBe(1);
    });
  });

  describe('getActiveConversation', () => {
    it('returns the conversation matching selectedConversationId', () => {
      useChatStore.setState({ selectedConversationId: 'api-integration' });
      const active = useChatStore.getState().getActiveConversation();
      expect(active?.id).toBe('api-integration');
    });

    it('returns undefined if selected id does not match any conversation', () => {
      useChatStore.setState({ selectedConversationId: 'non-existent-id' });
      const active = useChatStore.getState().getActiveConversation();
      expect(active).toBeUndefined();
    });

    it('returns the billing-issue conversation by default', () => {
      const active = useChatStore.getState().getActiveConversation();
      expect(active?.id).toBe('billing-issue');
    });
  });
});