(function() {
  // ======= Configuration =======
  // Default values that can be overridden by global variables
  const defaultColor = "#60A5FA"; // primary color
  const defaultTitle = "Chatbot"; // header text
  const defaultProjectID = ""; // Eden API project id

  const primaryColor = window.chatbotColor || defaultColor;
  const chatTitle = window.chatbotTitle || defaultTitle;
  const projectUUID = window.chatbotProject || defaultProjectID;

  // Eden API static settings
  const provider = "google";
  const model = "gemini-1.5-flash-8b";
  const max_tokens = 100;
  const temperature = 0.7;
  const k = 1;
  let historyChat = [];

  // ======= Load Marked.js if not already loaded =======
  if (typeof marked === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(script);
  }

  // ======= Create Chatbot Elements =======

  // Create the floating chat button
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
    zIndex: "1000"
  });

  // Create the chatbot container (initially hidden)
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
    fontFamily: "sans-serif"
  });

  // Chat container inner HTML with header, chat box, input, and button
  chatContainer.innerHTML = `
    <div id="chat-header" style="padding: 10px; background: ${primaryColor}; color: white; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
      <strong>${chatTitle}</strong>
      <span id="close-chat" style="cursor: pointer; font-size: 1.5rem;">✖</span>
    </div>
    <div id="chat-box" style="height: calc(100% - 110px); overflow-y: auto; padding: 10px; background: #f9f9f9;"></div>
    <div style="padding: 10px; border-top: 1px solid #ccc;">
      <input type="text" id="user-input" placeholder="Enter your message" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
      <button id="send-btn" style="margin-top: 8px; width: 100%; padding: 10px; background: ${primaryColor}; color: white; border: none; border-radius: 4px; cursor: pointer;">Send</button>
    </div>
  `;

  // Append elements to the document body
  document.body.appendChild(chatButton);
  document.body.appendChild(chatContainer);

  // ======= Event Listeners =======

  // Toggle chatbot visibility when clicking the button
  chatButton.addEventListener("click", function() {
    chatContainer.style.display = "block";
    chatButton.style.display = "none";
  });

  // Close chatbot when clicking the close icon
  document.getElementById("close-chat").addEventListener("click", function() {
    chatContainer.style.display = "none";
    chatButton.style.display = "flex";
  });

  // When pressing Enter in the input field, send the message
  document.getElementById("user-input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Send message on clicking the send button
  document.getElementById("send-btn").addEventListener("click", sendMessage);

  // ======= Loading Spinner =======
  function displayLoading() {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.style.display = "flex";
    loadingDiv.style.alignItems = "center";
    loadingDiv.style.margin = "5px 0";
    loadingDiv.innerHTML = `<div style="border: 4px solid rgba(0,0,0,0.1); border-left-color: #555; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-right: 8px;"></div><span>Thinking...</span>`;
    document.getElementById("chat-box").appendChild(loadingDiv);
    loadingDiv.scrollIntoView({ behavior: "smooth" });
  }

  // Remove loading spinner if present
  function removeLoading() {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // Add spinner animation keyframes
  const styleElem = document.createElement("style");
  styleElem.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleElem);

  // ======= Eden API Call and Markdown Formatting =======
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

  // ======= Message Display Functions =======

  // Display a message in the chat box
  function displayMessage(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.style.margin = "5px 0";
    messageDiv.style.maxWidth = "80%";
    messageDiv.style.padding = "8px";
    messageDiv.style.borderRadius = "5px";
    if (sender === "user") {
      messageDiv.style.background = "#e1e1e1";
      messageDiv.style.alignSelf = "flex-end";
      messageDiv.textContent = message;
    } else if (sender === "bot") {
      messageDiv.style.background = "#f0f0f0";
      messageDiv.style.alignSelf = "flex-start";
      // Render markdown using marked (if available)
      if (typeof marked !== "undefined") {
        messageDiv.innerHTML = marked.parse(message);
      } else {
        messageDiv.textContent = message;
      }
    }
    document.getElementById("chat-box").appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: "smooth" });
  }

  // ======= Send Message Functionality =======
  async function sendMessage() {
    const inputEl = document.getElementById("user-input");
    const userInput = inputEl.value.trim();
    if (!userInput) return;

    displayMessage(userInput, "user");
    inputEl.value = "";
    displayLoading();

    const responseText = await getEdenResponse(userInput);
    removeLoading();
    displayMessage(responseText, "bot");
  }
})();
