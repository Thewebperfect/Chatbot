(function() {
  // ======= Configuration (overridden by global variables) =======
  const primaryColor = window.chatbotColor || "#3B82F6"; // A more modern blue
  const chatTitle = window.chatbotTitle || "AI Assistant";
  const projectUUID = window.chatbotProject || "";

  // Eden API fixed settings
  const provider = "google";
  const model = "gemini-1.5-flash-8b";
  const max_tokens = 300;
  const temperature = 0.7;
  const k = 1;
  let historyChat = [];

  // ======= Load Marked.js for Markdown rendering =======
  if (typeof marked === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);
  }

  // ======= SVG Icons =======
  const chatIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 28px; height: 28px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.372c-1.07.107-2.13-.386-2.736-1.32l-1.928-2.892c-.41-.617-1.335-.617-1.745 0l-1.928 2.892c-.606.934-1.666 1.427-2.736 1.32l-3.722-.372C3.847 17.082 3 16.124 3 15.088v-4.286c0-.97.616-1.813 1.5-2.097l5.353-1.684a2.25 2.25 0 012.304 0l5.353 1.684z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.375V16.5" />
    </svg>
  `;

  const closeIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 28px; height: 28px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;
  
  const sendIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px;">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  `;

  // ======= CSS Styles (injected into head) =======
  const chatbotStyles = `
    :root {
      --chatbot-primary-color: ${primaryColor};
      --chatbot-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }

    #chatbot-toggle-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background-color: var(--chatbot-primary-color);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      transition: all 0.3s ease;
    }

    #chatbot-toggle-button:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    }
    
    #chatbot-toggle-button .icon {
      transition: transform 0.3s ease, opacity 0.2s ease;
      position: absolute;
    }
    
    #chatbot-toggle-button .icon.close {
      transform: rotate(-90deg) scale(0.5);
      opacity: 0;
    }

    #chatbot-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 420px;
      height: 65vh;
      max-height: 600px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1000;
      font-family: var(--chatbot-font);
      transform-origin: bottom right;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      transform: scale(0.95) translateY(20px);
      opacity: 0;
      pointer-events: none;
    }

    #chatbot-container.chatbot-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.chat {
      transform: rotate(90deg) scale(0.5);
      opacity: 0;
    }
    
    #chatbot-container.chatbot-open + #chatbot-toggle-button .icon.close {
      transform: rotate(0deg) scale(1);
      opacity: 1;
    }

    #chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--chatbot-primary-color), ${primaryColor}E6);
      color: white;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    #chat-header strong {
      font-size: 1.1rem;
      font-weight: 600;
    }

    #close-chat-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    
    #close-chat-btn:hover {
      opacity: 1;
    }

    #chat-box {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chatbot-message {
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 85%;
      word-wrap: break-word;
      animation: message-in 0.3s ease-out;
    }

    .chatbot-message.user {
      background: #e5e7eb;
      color: #1f2937;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .chatbot-message.bot {
      background: var(--chatbot-primary-color);
      color: white;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    
    .chatbot-message.bot a {
        color: #f0f0f0;
        text-decoration: underline;
    }
    .chatbot-message.bot p { margin: 0.5em 0; }
    .chatbot-message.bot p:first-child { margin-top: 0; }
    .chatbot-message.bot p:last-child { margin-bottom: 0; }
    .chatbot-message.bot ul, .chatbot-message.bot ol { padding-left: 20px; }

    #chat-input-area {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
      background: #ffffff;
    }

    #chat-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    #user-input {
      width: 100%;
      padding: 12px 48px 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    #user-input:focus {
      outline: none;
      border-color: var(--chatbot-primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    
    #send-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      background-color: var(--chatbot-primary-color);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.2s;
    }
    
    #send-btn:hover {
      background-color: ${primaryColor}D9; /* 85% opacity */
    }

    @keyframes message-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    #loading-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      align-self: flex-start;
      animation: message-in 0.3s ease-out;
    }
    
    .spinner {
      border: 3px solid rgba(0,0,0,0.1);
      border-left-color: var(--chatbot-primary-color);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      #chatbot-container {
        width: 100%;
        height: 100%;
        max-height: 100%;
        bottom: 0;
        right: 0;
        border-radius: 0;
        transform-origin: bottom center;
      }
      #chatbot-toggle-button {
        bottom: 15px;
        right: 15px;
      }
    }
  `;

  // ======= HTML Structure =======
  const chatbotHTML = `
    <div id="chatbot-container">
      <div id="chat-header">
        <strong>${chatTitle}</strong>
        <button id="close-chat-btn" aria-label="Close Chat">${closeIcon}</button>
      </div>
      <div id="chat-box"></div>
      <div id="chat-input-area">
        <div id="chat-input-container">
          <input type="text" id="user-input" placeholder="Type your message..." />
          <button id="send-btn" aria-label="Send Message">${sendIcon}</button>
        </div>
      </div>
    </div>
    <div id="chatbot-toggle-button" aria-label="Toggle Chat">
        <div class="icon chat">${chatIcon}</div>
        <div class="icon close">${closeIcon}</div>
    </div>
  `;

  // ======= Inject CSS and HTML into the page =======
  document.head.insertAdjacentHTML('beforeend', `<style>${chatbotStyles}</style>`);
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  
  // ======= DOM Element References =======
  const chatbotContainer = document.getElementById("chatbot-container");
  const toggleButton = document.getElementById("chatbot-toggle-button");
  const closeButton = document.getElementById("close-chat-btn");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-btn");

  // ======= Chat Logic =======

  const toggleChat = (forceClose = false) => {
    if (forceClose) {
        chatbotContainer.classList.remove('chatbot-open');
    } else {
        chatbotContainer.classList.toggle('chatbot-open');
    }
  };

  const displayMessage = (message, sender) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chatbot-message", sender); // 'user' or 'bot'
    
    if (sender === "bot") {
      // Use marked.js for rich text, but default to plain text if it's not loaded
      messageDiv.innerHTML = typeof marked !== "undefined" ? marked.parse(message) : message;
    } else {
      messageDiv.textContent = message;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  };
  
  const displayLoading = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.innerHTML = `<div class="spinner"></div><span>Thinking...</span>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  const removeLoading = () => {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) loadingDiv.remove();
  };
  
  const sendMessage = async () => {
    const text = userInput.value.trim();
    if (!text) return;

    displayMessage(text, "user");
    userInput.value = "";
    userInput.focus();
    displayLoading();

    try {
      const responseText = await getEdenResponse(text);
      removeLoading();
      displayMessage(responseText, "bot");
    } catch (error) {
      removeLoading();
      displayMessage("Sorry, I encountered an error. Please try again.", "bot");
    }
  };

  const getEdenResponse = async (text) => {
    // Return a dummy response if projectUUID is not set for local testing
    if (!projectUUID) {
        return new Promise(resolve => setTimeout(() => resolve("This is a dummy response. Please set `window.chatbotProject` to connect to Eden AI."), 1000));
    }
    
    const url = `https://api.edenai.run/v2/aiproducts/askyoda/v2/${projectUUID}/ask_llm_project`;
    const payload = {
      query: text,
      llm_provider: provider,
      llm_model: model,
      history: historyChat,
      k: k,
      max_tokens: max_tokens,
      temperature: temperature
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.result || "I'm sorry, I couldn't find an answer.";
      historyChat.push({ user: text, assistant: result }); // Update history
      return result;

    } catch (error) {
      console.error("Error fetching from Eden AI:", error);
      return "Error: Could not connect to the AI service.";
    }
  };

  // ======= Event Listeners =======
  toggleButton.addEventListener("click", () => toggleChat());
  closeButton.addEventListener("click", () => toggleChat(true));
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

})();
