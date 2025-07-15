(function() {
  // ======= Configuration (overridden by global variables) =======
  const primaryColor = window.chatbotColor || "#3B82F6"; // A modern blue
  const chatTitle = window.chatbotTitle || "AI Assistant";
  const projectUUID = window.chatbotProject || "";

  // Eden API fixed settings
  const provider = "google";
  const model = "gemini-1.5-flash-8b";
  const max_tokens = 150;
  const temperature = 0.7;
  const k = 1;

  // Local state
  const STORAGE_KEY = 'edenai_chatbot_conversations';
  let conversations = {};
  let activeConversationId = null;

  // ======= Load Marked.js for Markdown rendering =======
  if (typeof marked === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);
  }

  // ======= SVG Icons =======
  const mainIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 32px; height: 32px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 12.5C7.5 11.4 8.4 10.5 9.5 10.5H14.5C15.6 10.5 16.5 11.4 16.5 12.5V13.5C16.5 14.6 15.6 15.5 14.5 15.5H9.5C8.4 15.5 7.5 14.6 7.5 13.5V12.5Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.5V10C16.5 8.3 15.2 7 13.5 7H10.5C8.8 7 7.5 8.3 7.5 10V12.5" />
    </svg>
  `;
  const closeIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 28px; height: 28px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  `;
  const sendIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px;">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  `;
  const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>`;
  const messagesIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd" /></svg>`;
  const noMessagesIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 48px; height: 48px; color: #9ca3af;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.07.107-2.13-.386-2.736-1.32l-1.928-2.892c-.41-.617-1.335-.617-1.745 0l-1.928 2.892c-.606.934-1.666 1.427-2.736 1.32l-3.722-.372C3.847 17.082 3 16.124 3 15.088v-4.286c0-.97.616-1.813 1.5-2.097l5.353-1.684a2.25 2.25 0 012.304 0l5.353 1.684z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75h7.5" /></svg>`;

  // ======= CSS Styles =======
  const chatbotStyles = `
    :root {
      --chatbot-primary-color: ${primaryColor};
      --chatbot-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    #chatbot-toggle-button {
      position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
      background-color: var(--chatbot-primary-color); color: white;
      display: flex; justify-content: center; align-items: center; border-radius: 50%;
      cursor: pointer; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #chatbot-toggle-button:hover { transform: scale(1.1); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25); }
    #chatbot-toggle-button .icon { transition: transform 0.3s ease, opacity 0.2s ease; position: absolute; }
    #chatbot-toggle-button .icon.close { transform: rotate(-90deg) scale(0.5); opacity: 0; }
    #chatbot-container {
      position: fixed; bottom: 90px; right: 20px; width: 400px; height: 70vh; max-height: 620px;
      background: #f9fafb; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); border-radius: 16px;
      display: flex; flex-direction: column; overflow: hidden; z-index: 1000;
      font-family: var(--chatbot-font); transform-origin: bottom right;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      transform: scale(0.95) translateY(20px); opacity: 0; pointer-events: none;
    }
    #chatbot-container.chatbot-open {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: auto;
    }
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.main { transform: rotate(90deg) scale(0.5); opacity: 0; }
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.close { transform: rotate(0deg) scale(1); opacity: 1; }
    
    #chatbot-main { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
    #chatbot-views { display: flex; flex-grow: 1; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    #chatbot-views.show-chat { transform: translateX(-100%); }
    .chatbot-view { width: 100%; flex-shrink: 0; display: flex; flex-direction: column; background-color: #f9fafb; }

    /* Home View */
    #view-home .home-header {
      padding: 48px 24px 24px; text-align: center; color: white; flex-shrink: 0;
      background: linear-gradient(160deg, var(--chatbot-primary-color), ${primaryColor}B3 100%);
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    #view-home .home-header h1 { font-size: 2rem; font-weight: 700; margin: 0 0 4px; }
    #view-home .home-header p { font-size: 1rem; opacity: 0.9; margin: 0; }
    #view-home .conversation-list { flex-grow: 1; overflow-y: auto; padding: 8px; }
    #view-home .no-conversations { text-align: center; padding: 40px; color: #6b7280; }
    #view-home .no-conversations p { margin-top: 8px; }
    #view-home .conversation-item {
        display: flex; align-items: center; padding: 12px 16px; margin: 8px; border-radius: 8px;
        cursor: pointer; transition: background-color 0.2s; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    #view-home .conversation-item:hover { background-color: #f3f4f6; }
    #view-home .conversation-item-preview { flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #374151; }
    #view-home .conversation-item-preview .preview-text { color: #6b7280; font-size: 0.9rem; }
    #view-home .start-new-chat-btn {
        display: block; width: calc(100% - 32px); margin: 16px; padding: 14px; text-align: center; font-weight: 600;
        background: var(--chatbot-primary-color); color: white; border: none; border-radius: 8px;
        cursor: pointer; transition: background-color 0.2s;
    }

    /* Chat View */
    #chat-header {
      padding: 16px 20px; background: #fff; color: #1f2937; flex-shrink: 0;
      text-align: center; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #e5e7eb;
    }
    #chat-box {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .chatbot-message { padding: 10px 14px; border-radius: 18px; max-width: 85%; word-wrap: break-word; animation: message-in 0.3s ease-out; line-height: 1.5; }
    .chatbot-message.user { background: #e5e7eb; color: #1f2937; align-self: flex-end; border-bottom-right-radius: 4px; }
    .chatbot-message.bot { background: var(--chatbot-primary-color); color: white; align-self: flex-start; border-bottom-left-radius: 4px; }
    .chatbot-message.bot a { color: #f0f0f0; text-decoration: underline; }
    .chatbot-message.bot p { margin: 0.5em 0; } .chatbot-message.bot p:first-child { margin-top: 0; } .chatbot-message.bot p:last-child { margin-bottom: 0; }
    
    #chat-input-area { padding: 12px; border-top: 1px solid #e5e7eb; flex-shrink: 0; background: #fff; }
    #chat-input-container { position: relative; display: flex; align-items: center; }
    #user-input {
      width: 100%; padding: 12px 48px 12px 16px; border: 1px solid #d1d5db;
      border-radius: 20px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; background: #f3f4f6;
    }
    #user-input:focus { outline: none; border-color: var(--chatbot-primary-color); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
    #send-btn {
      position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px;
      background-color: var(--chatbot-primary-color); color: white; border: none; border-radius: 50%;
      cursor: pointer; display: flex; justify-content: center; align-items: center; transition: background-color 0.2s;
    }
    
    /* Footer */
    #chatbot-footer {
      display: flex; border-top: 1px solid #e5e7eb; background: #fff; flex-shrink: 0;
    }
    .footer-btn {
      flex: 1; padding: 12px; display: flex; flex-direction: column; align-items: center;
      gap: 4px; cursor: pointer; color: #6b7280; transition: color 0.2s;
    }
    .footer-btn span { font-size: 0.75rem; font-weight: 500; }
    .footer-btn:hover { color: #1f2937; }
    .footer-btn.active { color: var(--chatbot-primary-color); }

    @keyframes message-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    #loading-message { display: flex; align-items: center; gap: 8px; color: #6b7280; align-self: flex-start; animation: message-in 0.3s ease-out; }
    .spinner { border: 3px solid rgba(0,0,0,0.1); border-left-color: var(--chatbot-primary-color); border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive Design */
    @media (max-width: 480px) {
      #chatbot-container { width: 100%; height: 100%; max-height: 100%; bottom: 0; right: 0; border-radius: 0; }
      #chatbot-toggle-button { bottom: 15px; right: 15px; }
    }
  `;

  // ======= HTML Structure =======
  const chatbotHTML = `
    <div id="chatbot-container">
      <div id="chatbot-main">
        <div id="chatbot-views">
          <!-- Home View -->
          <div id="view-home" class="chatbot-view">
            <div class="home-header">
              <h1>Hi there 👋</h1>
              <p>How can the ${chatTitle} help?</p>
            </div>
            <div class="conversation-list">
              <!-- Conversation history will be rendered here -->
            </div>
            <button class="start-new-chat-btn">Start a New Conversation</button>
          </div>
          <!-- Chat View -->
          <div id="view-chat" class="chatbot-view">
            <div id="chat-header">Conversation</div>
            <div id="chat-box"></div>
            <div id="chat-input-area">
              <div id="chat-input-container">
                <input type="text" id="user-input" placeholder="Ask the AI..." />
                <button id="send-btn" aria-label="Send Message">${sendIcon}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="chatbot-footer">
        <button class="footer-btn active" id="nav-home">
          ${homeIcon} <span>Home</span>
        </button>
        <button class="footer-btn" id="nav-chat">
          ${messagesIcon} <span>Messages</span>
        </button>
      </div>
    </div>
    <div id="chatbot-toggle-button" aria-label="Toggle Chat">
      <div class="icon main">${mainIcon}</div>
      <div class="icon close">${closeIcon}</div>
    </div>
  `;
  
  // ======= Inject CSS and HTML =======
  document.head.insertAdjacentHTML('beforeend', `<style>${chatbotStyles}</style>`);
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  
  // ======= DOM Element References =======
  const chatbotContainer = document.getElementById("chatbot-container");
  const toggleButton = document.getElementById("chatbot-toggle-button");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-btn");
  const viewsContainer = document.getElementById("chatbot-views");
  const navHome = document.getElementById("nav-home");
  const navChat = document.getElementById("nav-chat");
  const conversationList = document.querySelector("#view-home .conversation-list");
  const startNewChatBtn = document.querySelector("#view-home .start-new-chat-btn");

  // ======= Core Functions =======

  const saveConversations = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  };
  
  const loadConversations = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    conversations = stored ? JSON.parse(stored) : {};
    renderHomeScreen();
  };

  const toggleChatbot = (forceClose = false) => {
    if (forceClose) {
      chatbotContainer.classList.remove('chatbot-open');
    } else {
      chatbotContainer.classList.toggle('chatbot-open');
    }
  };

  const navigateTo = (view) => {
    if (view === 'chat') {
      if (!activeConversationId) return; // Don't go to chat if none is active
      viewsContainer.classList.add('show-chat');
      navChat.classList.add('active');
      navHome.classList.remove('active');
    } else { // 'home'
      viewsContainer.classList.remove('show-chat');
      navHome.classList.add('active');
      navChat.classList.remove('active');
      activeConversationId = null;
      renderHomeScreen();
    }
  };
  
  const renderHomeScreen = () => {
    conversationList.innerHTML = '';
    const sortedConvos = Object.values(conversations).sort((a,b) => b.createdAt - a.createdAt);

    if (sortedConvos.length === 0) {
      conversationList.innerHTML = `<div class="no-conversations">${noMessagesIcon}<p>No conversations yet</p><span>Your chat history with the AI will appear here.</span></div>`;
    } else {
      sortedConvos.forEach(convo => {
        const firstUserMessage = convo.messages.find(m => m.sender === 'user')?.text || 'New Conversation';
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.innerHTML = `<div class="conversation-item-preview"><strong>${firstUserMessage}</strong><div class="preview-text">${new Date(convo.createdAt).toLocaleString()}</div></div>`;
        item.addEventListener('click', () => openConversation(convo.id));
        conversationList.appendChild(item);
      });
    }
  };
  
  const openConversation = (id) => {
    activeConversationId = id;
    const conversation = conversations[id];
    chatBox.innerHTML = '';
    conversation.messages.forEach(msg => displayMessage(msg.text, msg.sender, false));
    userInput.focus();
    navigateTo('chat');
  };

  const startNewConversation = () => {
    const newId = new Date().getTime();
    activeConversationId = newId;
    conversations[newId] = { id: newId, messages: [], createdAt: newId };
    saveConversations();
    openConversation(newId);
  };
  
  const displayMessage = (text, sender, isNew = true) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chatbot-message", sender);
    messageDiv.innerHTML = (sender === 'bot' && typeof marked !== "undefined") ? marked.parse(text) : text;
    chatBox.appendChild(messageDiv);
    if(isNew) chatBox.scrollTop = chatBox.scrollHeight;
  };

  const displayLoading = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.innerHTML = `<div class="spinner"></div><span>AI is thinking...</span>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  };
  
  const removeLoading = () => {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) loadingDiv.remove();
  };

  const sendMessage = async () => {
    const text = userInput.value.trim();
    if (!text || !activeConversationId) return;

    const userMessage = { sender: 'user', text: text };
    conversations[activeConversationId].messages.push(userMessage);
    displayMessage(text, 'user');
    saveConversations();
    userInput.value = "";
    userInput.focus();
    displayLoading();

    try {
      const responseText = await getEdenResponse(text);
      const botMessage = { sender: 'bot', text: responseText };
      conversations[activeConversationId].messages.push(botMessage);
      removeLoading();
      displayMessage(responseText, 'bot');
      saveConversations();
    } catch (error) {
      removeLoading();
      displayMessage("Sorry, I encountered an error. Please try again.", "bot");
    }
  };

  const getEdenResponse = async (text) => {
    if (!projectUUID) {
      return new Promise(resolve => setTimeout(() => resolve("This is a test response. Set `window.chatbotProject` to connect to Eden AI."), 1000));
    }

    // Pass only the current conversation's history
    const historyForAPI = conversations[activeConversationId].messages
      .slice(0, -1) // Exclude the latest user message which is in the 'query'
      .map(m => ({
        user: m.sender === 'user' ? m.text : undefined,
        assistant: m.sender === 'bot' ? m.text : undefined
      })).filter(m => m.user || m.assistant);
    
    const url = `https://api.edenai.run/v2/aiproducts/askyoda/v2/${projectUUID}/ask_llm_project`;
    const payload = {
      query: text, llm_provider: provider, llm_model: model,
      history: historyForAPI, k: k, max_tokens: max_tokens, temperature: temperature
    };

    try {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      return data.result || "I'm sorry, I couldn't find an answer.";
    } catch (error) {
      console.error("Error fetching from Eden AI:", error);
      return "Error: Could not connect to the AI service.";
    }
  };

  // ======= Event Listeners =======
  toggleButton.addEventListener("click", () => toggleChatbot());
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
  navHome.addEventListener('click', () => navigateTo('home'));
  navChat.addEventListener('click', () => navigateTo('chat'));
  startNewChatBtn.addEventListener('click', startNewConversation);

  // ======= Initial Load =======
  loadConversations();
  navigateTo('home');

})();
