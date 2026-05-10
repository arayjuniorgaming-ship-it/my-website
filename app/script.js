class AppChat {
    constructor() {
        this.username = '';
        this.peers = new Map();
        this.badWords = ['anjing','bangsat','babi','bajingan','bego','bodoh','goblok','gila','anjrit','andi','kontol','memek','ngentot','tai','setan','tolol','idiot','kampret','asu','brengsek','jancok','sialan','brengsek'];
        this.emojis = ['😀','😂','😍','😎','😢','😡','👍','🙏','🎉','❤️'];
        this.init();
        this.startBroadcastListener();
    }

    init() {
     this.usernameInput = document.getElementById('username');
        this.messageInput = document.getElementById('message-input');
        this.messagesEl = document.getElementById('messages');
        this.usersList = document.getElementById('users-list');
        this.userCount = document.getElementById('user-count');

        // Enter key
        this.messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && this.sendMessage());
        this.usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && this.joinChat());
        this.filterNote = document.getElementById('filter-note');
        this.emojiToggle = document.getElementById('emoji-toggle');
        this.emojiPicker = document.getElementById('emoji-picker');

        if (this.emojiToggle) {
            this.emojiToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleEmojiPicker();
            });
        }

        if (this.emojiPicker) {
            this.emojiPicker.addEventListener('click', (event) => {
                event.stopPropagation();
                const target = event.target;
                if (!(target instanceof Element)) return;
                const button = target.closest('.emoji-option');
                if (button) this.insertEmoji(button.textContent || '');
            });
        }

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (!target.closest('.emoji-picker') && !target.closest('#emoji-toggle')) {
                this.hideEmojiPicker();
            }
        });

        this.messagesEl.addEventListener('click', (event) => {
            const button = event.target.closest('.delete-chat');
            if (button) {
                this.deleteChat(button.dataset.msgId);
            }
        });

        // Logo hover effect
        const logoImg = document.querySelector('.logo-img');
        if (logoImg) {
            logoImg.addEventListener('click', () => this.usernameInput.focus());
            logoImg.addEventListener('mouseenter', () => {
                logoImg.style.transform = 'scale(1.15) rotate(360deg)';
            });
            logoImg.addEventListener('mouseleave', () => {
                logoImg.style.transform = 'scale(1) rotate(0deg)';
            });
        }

        this.messageInput.focus();   
    }

    joinChat() {
        const rawName = this.usernameInput.value.trim();
        if (!rawName) return alert('😅 Nama tidak boleh kosong!');
        if (this.containsBadWords(rawName)) return alert('😠 Username mengandung kata kasar. Gunakan nama lain.');

        this.username = rawName.slice(0, 20);

        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('chat-screen').classList.add('active');

        this.peers.set('self', this.username);
        this.broadcast({ type: 'join', username: this.username });
        this.updateUsersDisplay();
        this.addSystemMessage(`🎉 <strong>${this.username}</strong> masuk ke room!`);
        this.messageInput.focus();
     }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.username) return;

        const trimmedText = text.slice(0, 500);
        const sanitizedText = this.sanitizeText(trimmedText);

        if (sanitizedText !== trimmedText) {
            this.addSystemMessage('⚠️ Pesan disensor karena mengandung kata kasar.');
        }

        const msg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'message',
            username: this.username,
            text: sanitizedText,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }

        this.messageInput.value = '';
        this.renderMessage(msg);
        this.scrollToBottom();
        this.broadcast(msg);
    }

    renderMessage(msg) {
        const div = document.createElement('div');
        div.className = `message ${msg.username === this.username ? 'own' : 'other'}`;
        div.dataset.msgId = msg.id || '';

        const deleteButton = msg.username === this.username ? `<button class="delete-chat" data-msg-id="${msg.id}" title="Hapus chat">×</button>` : '';

        div.innerHTML = `
            <div class="message-header">
                <strong>${this.escapeHtml(msg.username)}</strong>
                <small>${msg.timestamp}</small>
                ${deleteButton}
            </div>
            <div class="msg-bubble">${this.escapeHtml(this.sanitizeText(msg.text))}</div>
        `;
        this.messagesEl.appendChild(div);
    }

    addSystemMessage(html) {
        const div = document.createElement('div');
        div.className = 'message system';
        div.innerHTML = html;
        this.messagesEl.appendChild(div);
        this.scrollToBottom();
    }

    updateUsersDisplay() {
        const count = this.peers.size;
        this.userCount.innerHTML = `${count} <strong>online</strong>`;

        this.usersList.innerHTML = '';
        this.peers.forEach((username) => {
            const span = document.createElement('span');
            span.className = 'user-tag';
            span.textContent = username;
            this.usersList.appendChild(span);
        });
    }
    scrollToBottom() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    broadcast(data) {
        const broadcastData = { time: Date.now(), data };
        localStorage.setItem('chat-broadcast-v2', JSON.stringify(broadcastData));
        window.dispatchEvent(new CustomEvent('chat-broadcast', { detail: broadcastData }));
    }
    startBroadcastListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'chat-broadcast-v2') {
                try {
                    const { data, time } = JSON.parse(e.newValue);
                    if (time > Date.now() - 15000) this.handleBroadcast(data);
                } catch {}
            }
        });
    }
    sanitizeText(text) {
        const pattern = new RegExp(`\\b(${this.badWords.join('|')})\\b`, 'gi');
        return text.replace(pattern, (match) => '*'.repeat(match.length));
    }

    containsBadWords(text) {
        const pattern = new RegExp(`\\b(${this.badWords.join('|')})\\b`, 'i');
        return pattern.test(text);
    }

    toggleEmojiPicker() {
        if (!this.emojiPicker) return;
        this.emojiPicker.hidden = !this.emojiPicker.hidden;
    }

    hideEmojiPicker() {
        if (!this.emojiPicker) return;
        this.emojiPicker.hidden = true;
    }

    insertEmoji(emoji) {
        if (!emoji || !this.messageInput) return;
        const start = this.messageInput.selectionStart || 0;
        const end = this.messageInput.selectionEnd || 0;
        const value = this.messageInput.value;
        this.messageInput.value = value.slice(0, start) + emoji + value.slice(end);
        this.messageInput.focus();
        const cursorPosition = start + emoji.length;
        this.messageInput.setSelectionRange(cursorPosition, cursorPosition);
        this.hideEmojiPicker();
    }

    deleteChat(id, broadcast = true) {
        const messageNode = this.messagesEl.querySelector(`[data-msg-id="${id}"]`);
        if (!messageNode) return;

        messageNode.remove();
        this.addSystemMessage('🗑️ Pesan telah dihapus.');

        if (broadcast) {
            this.broadcast({ type: 'delete', id });
        }
    }

    handleBroadcast(data) {
        if (!this.username) return;

        if (data.type === 'delete') {
            const messageNode = this.messagesEl.querySelector(`[data-msg-id="${data.id}"]`);
            if (messageNode) {
                messageNode.remove();
                this.addSystemMessage('🗑️ Pesan telah dihapus oleh pengguna lain.');
            }
            return;
        }

        if (data.type === 'join') {
            if (data.username !== this.username && !this.peers.has(data.username)) {
                this.peers.set(data.username, data.username);
                this.updateUsersDisplay();
                this.addSystemMessage(`👋 <strong>${data.username}</strong> bergabung`);
            }
        } else if (data.type === 'message' && data.username !== this.username) {
            this.renderMessage(data);
        }
    }
}

const appchat = new AppChat();
window.appchat = appchat;

window.joinChat = () => appchat.joinChat();
window.sendMessage = () => appchat.sendMessage();