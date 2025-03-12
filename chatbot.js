(function() {
  // ======= Configuration =======
  const primaryColor   = "#60A5FA";
  const chatTitle      = "My Chatbot";
  const projectUUID    = "";

  const provider       = "google";
  const model          = "gemini-1.5-flash-8b";
  const max_tokens     = 100;
  const temperature    = 0.7;
  const k              = 1;
  let historyChat      = [];

  // ======= Load Marked.js if not already loaded =======
  if (typeof marked === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);
  }

  // ======= Create the floating chat button =======
  const chatButton = document.createElement("div");
  chatButton.innerHTML = "💬";
  Object.assign(chatButton.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    background: primaryColor,
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    zIndex: "1000",
    fontSize: "1.5rem",
    fontFamily: "sans-serif"
  });

  // ======= Create the chatbot container (flex column) =======
  const chatContainer = document.createElement("div");
  Object.assign(chatContainer.style, {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    width: "400px",
    height: "600px",
    background: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    borderRadius: "12px",
    display: "none",
    zIndex: "1000",
    fontFamily: "sans-serif",
    // FLEX layout:
    display: "flex",
    flexDirection: "column"
  });

  // Chat container inner HTML
  chatContainer.innerHTML = `
    <!-- HEADER -->
    <div id="chat-header" 
         style="
           padding: 10px; 
           background: ${primaryColor}; 
           color: white; 
           border-radius: 12px 12px 0 0; 
           display: flex; 
           justify-content: space-between; 
           align-items: center;
           flex-shrink: 0;
         ">
      <strong>${chatTitle}</strong>
      <span id="close-chat" style="cursor: pointer; font-size: 1.5rem;">✖</span>
    </div>

    <!-- CHAT MESSAGES (flex-grow) -->
    <div id="chat-box" 
         style="
           flex: 1; 
           overflow-y: auto; 
           padding: 10px; 
           background: #f9f9f9;
         ">
    </div>

    <!-- INPUT AREA -->
    <div style="padding: 10px; border-top: 1px solid #ccc; flex-shrink: 0;">
      <input 
        type="text" 
        id="user-input" 
        placeholder="Enter your message"
        style="
          width: 100%; 
          padding: 10px; 
          border: 1px solid #ccc; 
          border-radius: 4px;
        "
      />
      <button 
        id="send-btn"
        style="
          margin-top: 8px; 
          width: 100%; 
          padding: 10px; 
          background: ${primaryColor}; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
        "
      >
        Send
      </button>
    </div>
  `;

  // Append elements to body
  document.body.appendChild(chatButton);
  document.body.appendChild(chatContainer);

  // ======= Spinner Style (for loading) =======
  const styleElem = document.createElement("style");
  styleElem.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleElem);

  // ======= Toggle chatbot =======
  chatButton.addEventListener("click", () => {
    chatContainer.style.display = "block";
    chatButton.style.display = "none";
  });

  document.getElementById("close-chat").addEventListener("click", () => {
    chatContainer.style.display = "none";
    chatButton.style.display = "flex";
  });

  // ======= Sending a Message =======
  document.getElementById("user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  document.getElementById("send-btn").addEventListener("click", sendMessage);

  function displayLoading() {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.style.display = "flex";
    loadingDiv.style.alignItems = "center";
    loadingDiv.style.margin = "5px 0";
    loadingDiv.innerHTML = `
      <div 
        style="
          border: 4px solid rgba(0,0,0,0.1); 
          border-left-color: #555; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px; 
          animation: spin 1s linear infinite; 
          margin-right: 8px;
        ">
      </div>
      <span>Thinking...</span>
    `;
    document.getElementById("chat-box").appendChild(loadingDiv);
    loadingDiv.scrollIntoView({ behavior: "smooth" });
  }

  function removeLoading() {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  async function sendMessage() {
    const inputEl = document.getElementById("user-input");
    const userInput = inputEl.value.trim();
    if (!userInput) return;

    // Show user message
    displayMessage(userInput, "user");
    inputEl.value = "";
    displayLoading();

    // Get Eden response
    const responseText = await getEdenResponse(userInput);
    removeLoading();
    displayMessage(responseText, "bot");
  }

  async function getEdenResponse(text) {
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
      if (response.ok) {
        const data = await response.json();
        const result = data.result || "No response from AI.";
        historyChat.push({ user: text, assistant: result });
        return result;
      } else {
        return "Error: Unable to fetch response.";
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      return "Error: An unexpected error occurred.";
    }
  }

  function displayMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.style.margin = "5px 0";
    messageDiv.style.padding = "8px";
    messageDiv.style.borderRadius = "5px";
    messageDiv.style.maxWidth = "80%";

    if (sender === "user") {
      messageDiv.style.background = "#e1e1e1";
      messageDiv.style.alignSelf = "flex-end";
      messageDiv.textContent = message;
    } else {
      messageDiv.style.background = "#f0f0f0";
      messageDiv.style.alignSelf = "flex-start";
      if (typeof marked !== "undefined") {
        messageDiv.innerHTML = marked.parse(message);
      } else {
        messageDiv.textContent = message;
      }
    }

    const chatBox = document.getElementById("chat-box");
    // Ensure the chat box is using flex or block layout:
    chatBox.style.display = "flex";
    chatBox.style.flexDirection = "column";
    chatBox.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: "smooth" });
  }
})();
