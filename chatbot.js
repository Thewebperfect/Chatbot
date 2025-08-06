(function() {
  // ======= Configuration (overridden by global variables) =======
  const primaryColor = window.chatbotColor || "#4299E1"; // Blue from the image
  const chatTitle = window.chatbotTitle || "VetFlash Support";
  const projectUUID = window.chatbotProject || "";

  // Eden API fixed settings
  const provider = "google";
  const model = "gemini-1.5-flash-8b";
  const max_tokens = 400;
  const temperature = 0.7;
  const k = 1;

  // Local state - New key to prevent loading old, broken data structures
  const STORAGE_KEY = 'edenai_chatbot_conversations_v5_stable';
  let conversations = {};
  let activeConversationId = null;

  // ======= Load Marked.js for Markdown rendering =======
  if (typeof marked === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);
  }

  // ======= SVG Icons =======
  const mainIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 28px; height: 28px;"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd" /></svg>`;
  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
  const sendIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px;"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>`;
  const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>`;
  const chatIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd" /></svg>`;
  const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.749.654H5.89a.75.75 0 01-.749-.654L4.135 6.68l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z" clip-rule="evenodd" /></svg>`;

  // ======= CSS Styles (WITH ROBUST SCROLLING FIX) =======
  const chatbotStyles = `
    :root {
      --chatbot-primary-color: ${primaryColor};
      --chatbot-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    #chatbot-toggle-button {
      position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: var(--chatbot-primary-color); color: white;
      display: flex; justify-content: center; align-items: center; border-radius: 50%; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); z-index: 1000; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #chatbot-toggle-button:hover { transform: scale(1.1); }
    #chatbot-toggle-button .icon { transition: transform 0.3s ease, opacity 0.2s ease; position: absolute; }
    #chatbot-toggle-button .icon.close { transform: rotate(-90deg) scale(0.5); opacity: 0; }
    #chatbot-container {
      position: fixed; bottom: 90px; right: 20px; width: 380px; height: 70vh; max-height: 600px;
      background: #ffffff; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); border-radius: 16px;
      display: flex; flex-direction: column; overflow: hidden; z-index: 1000;
      font-family: var(--chatbot-font); transform-origin: bottom right;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      transform: scale(0.95) translateY(20px); opacity: 0; pointer-events: none;
    }
    #chatbot-container.chatbot-open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.main { transform: rotate(90deg) scale(0.5); opacity: 0; }
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.close { transform: rotate(0deg) scale(1); opacity: 1; }
    
    #chatbot-main { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
    #chatbot-views { display: flex; flex-grow: 1; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    #chatbot-views.show-chat { transform: translateX(-100%); }
    .chatbot-view { width: 100%; flex-shrink: 0; display: flex; flex-direction: column; }

    #view-home { background-color: #ffffff; }
    .home-header { padding: 32px 24px 24px; text-align: center; color: white; flex-shrink: 0; background: var(--chatbot-primary-color); }
    .home-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 4px; }
    .home-header p { font-size: 0.95rem; opacity: 0.9; margin: 0; }
    .conversation-list { flex: 1 1 0; overflow-y: auto; }
    .no-conversations { text-align: center; padding: 40px 24px; color: #6b7280; }
    .conversation-item { display: flex; align-items: center; padding: 14px 24px; cursor: pointer; transition: background-color 0.2s; border-bottom: 1px solid #e5e7eb; }
    .conversation-item:hover { background-color: #f9fafb; }
    .conversation-item-details { flex-grow: 1; min-width: 0; }
    .conversation-item strong { font-size: 1rem; color: #1f2937; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conversation-item .timestamp { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }
    .delete-convo-btn { flex-shrink: 0; padding: 8px; margin-left: 12px; border-radius: 50%; border: none; background: none; color: #9ca3af; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
    .delete-convo-btn:hover { background-color: #fee2e2; color: #dc2626; }
    .home-footer { padding: 16px; flex-shrink: 0; background-color: #ffffff; border-top: 1px solid #e5e7eb; }

    #view-chat { background-color: #ffffff; }
    #chat-header { padding: 16px 20px; color: #1f2937; flex-shrink: 0; text-align: center; font-weight: 600; font-size: 1rem; border-bottom: 1px solid #e5e7eb; }
    #chat-box { flex: 1 1 0; overflow-y: auto; padding: 16px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px; }
    #chat-input-area { padding: 12px; border-top: 1px solid #e5e7eb; flex-shrink: 0; background: #fff; }

    .start-new-chat-btn { display: block; width: 100%; padding: 14px; text-align: center; font-weight: 600; background: var(--chatbot-primary-color); color: white; border: none; border-radius: 12px; cursor: pointer; transition: background-color 0.2s; }
    .chatbot-message { padding: 10px 14px; border-radius: 18px; max-width: 85%; word-wrap: break-word; animation: message-in 0.3s ease-out; line-height: 1.5; }
    .chatbot-message.user { background: #e5e7eb; color: #1f2937; align-self: flex-end; border-bottom-right-radius: 4px; }
    .chatbot-message.bot { background: var(--chatbot-primary-color); color: white; align-self: flex-start; border-bottom-left-radius: 4px; }
    .chatbot-message.bot p { margin: 0.5em 0; }
    #chat-input-container { position: relative; display: flex; align-items: center; }
    #user-input { width: 100%; padding: 12px 48px 12px 16px; border: 1px solid #d1d5db; border-radius: 20px; font-size: 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
    #user-input:focus { outline: none; border-color: var(--chatbot-primary-color); box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2); }
    #send-btn { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; background-color: var(--chatbot-primary-color); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: background-color 0.2s; }
    
    #chatbot-footer { display: flex; border-top: 1px solid #d1d5db; background: #f9fafb; flex-shrink: 0; }
    .footer-btn { flex: 1; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; color: #6b7280; transition: color 0.2s; border: none; background: none; }
    .footer-btn span { font-size: 0.75rem; font-weight: 500; }
    .footer-btn.active { color: var(--chatbot-primary-color); }

    @keyframes message-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    #loading-message { display: flex; align-items: center; gap: 8px; color: #6b7280; align-self: flex-start; animation: message-in 0.3s ease-out; padding: 10px 14px; }
    .spinner { border: 3px solid rgba(0,0,0,0.1); border-left-color: #6b7280; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

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
          <div id="view-home" class="chatbot-view">
            <div class="home-header">
              <h1>Hi there 👋</h1>
              <p>How can ${chatTitle} help?</p>
            </div>
            <div class="conversation-list"></div>
            <div class="home-footer">
              <button class="start-new-chat-btn">Start a New Conversation</button>
            </div>
          </div>
          <div id="view-chat" class="chatbot-view">
            <div id="chat-header">${chatTitle}</div>
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
          ${chatIconSVG} <span>Chat</span>
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
  const get = (id) => document.getElementById(id);
  const chatbotContainer = get("chatbot-container");
  const toggleButton = get("chatbot-toggle-button");
  const chatBox = get("chat-box");
  const userInput = get("user-input");
  const sendButton = get("send-btn");
  const viewsContainer = get("chatbot-views");
  const navHome = get("nav-home");
  const navChat = get("nav-chat");
  const conversationList = document.querySelector("#view-home .conversation-list");
  const startNewChatBtn = document.querySelector(".start-new-chat-btn");

  // ======= Core Functions =======

  const saveConversations = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  
  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      conversations = stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Could not parse conversations from localStorage", e);
      conversations = {};
    }
    renderHomeScreen();
  };

  const toggleChatbot = (forceClose = false) => chatbotContainer.classList.toggle('chatbot-open', !forceClose && !chatbotContainer.classList.contains('chatbot-open'));

  const navigateTo = (view) => {
    if (view === 'chat') {
      if (!activeConversationId) {
        const sortedConvos = Object.values(conversations).sort((a,b) => b.createdAt - a.createdAt);
        if (sortedConvos.length > 0) {
          openConversation(sortedConvos[0].id, false);
        } else {
          startNewConversation();
          return;
        }
      }
      viewsContainer.classList.add('show-chat');
      navChat.classList.add('active');
      navHome.classList.remove('active');
      userInput.focus();
    } else {
      viewsContainer.classList.remove('show-chat');
      navHome.classList.add('active');
      navChat.classList.remove('active');
      renderHomeScreen();
    }
  };
  
  const renderHomeScreen = () => {
    conversationList.innerHTML = '';
    const sortedConvos = Object.values(conversations).sort((a,b) => b.createdAt - a.createdAt);
    if (sortedConvos.length === 0) {
      conversationList.innerHTML = `<div class="no-conversations"><p>Your previous chats will appear here.</p></div>`;
    } else {
      sortedConvos.forEach(convo => {
        const firstUserMessage = convo.messages.find(m => m.sender === 'user')?.text || 'New Conversation';
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.id = convo.id;
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'conversation-item-details';
        const strongEl = document.createElement('strong');
        strongEl.textContent = firstUserMessage;
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = new Date(convo.createdAt).toLocaleString();
        detailsDiv.appendChild(strongEl);
        detailsDiv.appendChild(timestampDiv);

        item.appendChild(detailsDiv);
        item.innerHTML += `<button class="delete-convo-btn" aria-label="Delete conversation">${trashIcon}</button>`;
        conversationList.appendChild(item);
      });
    }
  };
  
  const deleteConversation = (id) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      delete conversations[id];
      if (activeConversationId === id) {
        activeConversationId = null;
        chatBox.innerHTML = '';
        navChat.classList.remove('active');
      }
      saveConversations();
      renderHomeScreen();
    }
  };

  const openConversation = (id, shouldNavigate = true) => {
    activeConversationId = id;
    const conversation = conversations[id];
    if (!conversation) return;
    chatBox.innerHTML = '';
    conversation.messages.forEach(msg => displayMessage(msg.text, msg.sender, false));
    if (shouldNavigate) navigateTo('chat');
  };

  const startNewConversation = () => {
    const newId = Date.now();
    activeConversationId = newId;
    conversations[newId] = { id: newId, messages: [], createdAt: newId };
    saveConversations();
    openConversation(newId, true);
  };
  
  const displayMessage = (text, sender, isNew = true) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chatbot-message", sender);
    if (sender === 'bot') {
      messageDiv.innerHTML = typeof marked !== "undefined" ? marked.parse(text) : text;
    } else {
      messageDiv.textContent = text;
    }
    chatBox.appendChild(messageDiv);
    if (isNew) chatBox.scrollTop = chatBox.scrollHeight;
  };

  const displayLoading = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.innerHTML = `<div class="spinner"></div><span>AI is thinking...</span>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  };
  
  const removeLoading = () => document.getElementById("loading-message")?.remove();

  const sendMessage = async () => {
    const text = userInput.value.trim();
    if (!text || !activeConversationId) return;
    const userMessage = { sender: 'user', text };
    conversations[activeConversationId].messages.push(userMessage);
    displayMessage(text, 'user');
    userInput.value = "";
    userInput.focus();
    displayLoading();
    saveConversations();
    try {
      const responseText = await getEdenResponse(text);
      conversations[activeConversationId].messages.push({ sender: 'bot', text: responseText });
      removeLoading();
      displayMessage(responseText, 'bot');
    } catch (error) {
      console.error("EdenAI Error:", error);
      const errorMessage = error.message || "Could not connect to the AI service.";
      conversations[activeConversationId].messages.push({ sender: 'bot', text: `Error: ${errorMessage}` });
      removeLoading();
      displayMessage(`Sorry, an error occurred: ${errorMessage}`, 'bot');
    } finally {
        saveConversations();
    }
  };
  
  const getEdenResponse = async (text) => {
    if (!projectUUID) {
      return new Promise(resolve => setTimeout(() => resolve("This is a test response. Please set `window.chatbotProject` to connect to a real Eden AI project."), 1000));
    }
    
    const historyForAPI = [];
    const messages = conversations[activeConversationId].messages.slice(0, -1);
    
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i]?.sender === 'user' && messages[i+1]?.sender === 'bot') {
        historyForAPI.push({ 
          user: messages[i].text, 
          assistant: messages[i+1].text 
        });
      }
    }

    const payload = {
        query: text,
        llm_provider: provider,
        llm_model: model,
        history: historyForAPI,
        k,
        max_tokens,
        temperature
    };
    
    const response = await fetch(`https://api.edenai.run/v2/aiproducts/askyoda/v2/${projectUUID}/ask_llm_project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json();
        const errMsg = errData.error?.message?.history?.[0] || errData.error?.message?.detail || errData.error?.message || `API Error: ${response.statusText}`;
        throw new Error(errMsg);
    }

    const data = await response.json();
    return data.result || "I'm sorry, I couldn't find an answer.";
  };

  // ======= Event Listeners (WITH STOP PROPAGATION FIX) =======
  toggleButton.addEventListener("click", (e) => {
    e.stopPropagation(); // FIX: Prevent the click from bubbling up to the document.
    toggleChatbot();
  });
  sendButton.addEventListener("click", (e) => {
    e.stopPropagation(); // FIX: Prevent the click from bubbling up to the document.
    sendMessage();
  });
  userInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  
  navHome.addEventListener('click', (e) => {
    e.stopPropagation(); // FIX: Prevent the click from bubbling up to the document.
    navigateTo('home');
  });
  navChat.addEventListener('click', (e) => {
    e.stopPropagation(); // FIX: Prevent the click from bubbling up to the document.
    navigateTo('chat');
  });
  startNewChatBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // FIX: Prevent the click from bubbling up to the document.
    startNewConversation();
  });
  
  conversationList.addEventListener('click', (e) => {
    e.stopPropagation(); // FIX: Prevent clicks inside this area from bubbling up to the document.
    const target = e.target;
    const convoItem = target.closest('.conversation-item');
    if (!convoItem) return;
    const id = parseInt(convoItem.dataset.id, 10);
    if (target.closest('.delete-convo-btn')) {
      deleteConversation(id);
    } else {
      openConversation(id);
    }
  });

  // ======= Initial Load =======
  loadConversations();
  navigateTo('home');
})();
