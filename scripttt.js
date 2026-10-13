const $ = (selector) => document.querySelector(selector);

const welcome = $("#welcome");
const messagesEl = $("#messages");
const chatScroll = $("#chatScroll");
const input = $("#messageInput");
const sendBtn = $("#sendBtn");
const chatForm = $("#chatForm");
const historyList = $("#historyList");
const pageLabel = $("#pageLabel");
const sidebar = $("#sidebar");
const mobileOverlay = $("#mobileOverlay");
const toast = $("#toast");

let conversations = [];
let currentId = null;
let isThinking = false;
let toastTimer;

try {
  const saved = localStorage.getItem("my-ai-studio-chats");
  conversations = saved ? JSON.parse(saved) : [];
  if (!Array.isArray(conversations)) conversations = [];
} catch {
  conversations = [];
}

function saveConversations() {
  try {
    localStorage.setItem("my-ai-studio-chats", JSON.stringify(conversations));
  } catch {
    showToast("Couldn't save history in this browser.");
  }
}

function getCurrentChat() {
  return conversations.find((chat) => chat.id === currentId);
}

function createConversation() {
  const chat = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now()
  };

  conversations.unshift(chat);
  currentId = chat.id;
  saveConversations();
  renderHistory();
  renderConversation();
  closeMobileSidebar();
  input.focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderHistory() {
  historyList.replaceChildren();

  if (!conversations.length) {
    const empty = document.createElement("div");
    empty.className = "sidebar-note";
    empty.textContent = "Your conversations will appear here.";
    historyList.appendChild(empty);
    return;
  }

  conversations.forEach((chat) => {
    const button = document.createElement("button");
    button.className = "history-item" + (chat.id === currentId ? " active" : "");
    button.type = "button";

    const symbol = document.createElement("span");
    symbol.className = "history-symbol";
    symbol.textContent = "◷";

    const name = document.createElement("span");
    name.className = "history-name";
    name.textContent = chat.title;

    button.append(symbol, name);
    button.addEventListener("click", () => {
      currentId = chat.id;
      renderHistory();
      renderConversation();
      closeMobileSidebar();
    });

    historyList.appendChild(button);
  });
}

function renderConversation() {
  const chat = getCurrentChat();
  const hasMessages = Boolean(chat && chat.messages.length);

  welcome.classList.toggle("hidden", hasMessages);
  messagesEl.replaceChildren();
  pageLabel.textContent = hasMessages ? chat.title : "New conversation";

  if (hasMessages) {
    chat.messages.forEach((message) => {
      addMessageToDOM(message, false);
    });
  }

  scrollToBottom();
}

function addMessageToDOM(message, animate = true) {
  const row = document.createElement("article");
  row.className = `message ${message.role}`;
  if (!animate) row.style.animation = "none";

  if (message.role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "✳";
    avatar.setAttribute("aria-label", "Nova");
    row.appendChild(avatar);
  }

  const content = document.createElement("div");
  content.className = "message-content";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const name = document.createElement("strong");
  name.textContent = message.role === "user" ? "You" : "Nova";

  const time = document.createElement("time");
  time.textContent = message.time || formatTime(new Date());

  meta.append(name, time);

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  // textContent prevents user messages from being interpreted as HTML.
  bubble.textContent = message.content;

  content.append(meta, bubble);

  if (message.role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "message-action";
    copy.textContent = "▢ Copy";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        showToast("Response copied!");
      } catch {
        showToast("Copy isn't available here. Select the text to copy it.");
      }
    });

    const helpful = document.createElement("button");
    helpful.type = "button";
    helpful.className = "message-action";
    helpful.textContent = "♡ Helpful";
    helpful.addEventListener("click", () => showToast("Thanks for the feedback!"));

    actions.append(copy, helpful);
    content.appendChild(actions);
  }

  row.appendChild(content);
  messagesEl.appendChild(row);
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatScroll.scrollTop = chatScroll.scrollHeight;
  });
}

function showTyping() {
  const row = document.createElement("article");
  row.className = "message assistant";
  row.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "✳";

  const content = document.createElement("div");
  content.className = "message-content";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const name = document.createElement("strong");
  name.textContent = "Nova";

  const status = document.createElement("time");
  status.textContent = "thinking…";
  meta.append(name, status);

  const dots = document.createElement("div");
  dots.className = "typing";
  dots.innerHTML = "<span></span><span></span><span></span>";

  content.append(meta, dots);
  row.append(avatar, content);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  $("#typingIndicator")?.remove();
}

// These are sample replies, not responses from a real AI model.
function getDemoReply(text) {
  const value = text.toLowerCase();

  if (/\b(hi|hello|hey|hii|hola)\b/.test(value)) {
    return "Hey there! ✨ I'm Nova, your demo companion inside My AI Studio.\n\nI'm here to help you explore ideas, practise something new, or plan your next project. What are we creating today?";
  }

  if (value.includes("brainstorm") || value.includes("idea")) {
    return "Let's turn that curiosity into something exciting! ✨\n\nHere are three ways to start:\n\n1. **Go creative:** Design a personal website that reflects your personality.\n2. **Solve a problem:** Find one small everyday annoyance and invent a solution.\n3. **Experiment:** Combine two unrelated interests into one project.\n\nTip: Start with the smallest version you can build today. Which direction sounds most fun?";
  }

  if (value.includes("learn") || value.includes("teach") || value.includes("explain")) {
    return "Let's make learning feel less overwhelming. 💡\n\nTry this simple approach:\n\n1. **Understand:** Learn the main idea in plain language.\n2. **See it:** Look at a real-world example.\n3. **Try it:** Solve one small problem yourself.\n4. **Explain it:** Describe what you learned in your own words.\n\nTell me the exact topic you'd like to explore. This demo can offer sample guidance, but it doesn't have live AI knowledge.";
  }

  if (value.includes("website") || value.includes("design") || value.includes("ui") || value.includes("ux")) {
    return "Let's make your website feel polished and intentional. 🎨\n\nA few design principles to try:\n\n• **Hierarchy:** Give the most important element the most attention.\n• **Consistency:** Reuse the same spacing, colours and button styles.\n• **Whitespace:** Let content breathe instead of filling every gap.\n• **Feedback:** Make buttons visibly respond when people interact with them.\n• **Mobile first:** Make sure the experience works on a small screen, too.\n\nFor My AI Studio, I'd keep the violet accents, soft borders and spacious chat area.";
  }

  if (value.includes("challenge") || value.includes("surprise")) {
    return "Here's a little creative challenge! ✦\n\n**The 20-minute invention challenge**\n\nChoose an everyday problem, sketch a solution, give it a name, and describe how someone would use it in three steps.\n\nBonus: Design a tiny landing page for your invention using only two colours and one font.\n\nSmall ideas can become surprisingly good projects. Want another challenge? Try sending a new message.";
  }

  if (value.includes("code") || value.includes("program") || value.includes("javascript") || value.includes("html")) {
    return "Coding gets easier when you break a big task into smaller pieces. 💻\n\nTry this workflow:\n\n1. Describe what you want the program to do.\n2. Split it into small steps.\n3. Write one piece at a time.\n4. Test each change before moving on.\n5. Read the exact error message when something fails.\n\nThis is a simulated response, so I can't actually run or debug code here. You can still use this chat interface to practise organising your questions.";
  }

  if (value.includes("thank")) {
    return "You're welcome! 💜 Keep experimenting, stay curious, and remember that your first version doesn't need to be perfect. What matters is that you keep building.";
  }

  const replies = [
    `That's an interesting starting point! ✨\n\nTry breaking "${text}" into three questions:\n\n• What are you trying to achieve?\n• What do you already know?\n• What's the smallest useful next step?\n\nAnswering those can help turn a broad idea into a practical plan.\n\nI'm currently a demo chatbot, so this reply is a preset sample rather than live AI reasoning.`,
    `Let's explore that a little further. 💜\n\nOne useful way to approach this is to list your options, compare the advantages of each, and then choose one small action to test your idea.\n\nWhat would success look like for you?\n\nNote: My AI Studio is in demo mode, so I can't generate personalised live AI answers yet.`,
    `Here's a simple way to get started:\n\n1. Write down the main goal.\n2. Identify the first thing you need to figure out.\n3. Try a small experiment.\n4. Review what worked and adjust.\n\nProgress comes from making the next step clear, not from having every answer at once. ✦\n\nThis is a sample response from the local demo.`
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

function sendMessage(text) {
  const cleanText = text.trim();

  if (!cleanText || isThinking) return;

  let chat = getCurrentChat();

  if (!chat) {
    createConversation();
    chat = getCurrentChat();
  }

  const userMessage = {
    role: "user",
    content: cleanText,
    time: formatTime(new Date())
  };

  chat.messages.push(userMessage);

  if (chat.title === "New conversation") {
    chat.title = cleanText.length > 28
      ? cleanText.slice(0, 28).trim() + "…"
      : cleanText;
  }

  chat.updatedAt = Date.now();
  saveConversations();

  welcome.classList.add("hidden");
  addMessageToDOM(userMessage);
  renderHistory();
  pageLabel.textContent = chat.title;

  input.value = "";
  resizeInput();
  updateSendButton();

  isThinking = true;
  updateSendButton();
  showTyping();

  // Simulate a short response delay for the demo experience.
  const delay = 700 + Math.random() * 800;

  setTimeout(() => {
    removeTyping();

    const currentChat = getCurrentChat();
    if (!currentChat) {
      isThinking = false;
      updateSendButton();
      return;
    }

    const reply = {
      role: "assistant",
      content: getDemoReply(cleanText),
      time: formatTime(new Date())
    };

    currentChat.messages.push(reply);
    currentChat.updatedAt = Date.now();
    saveConversations();

    addMessageToDOM(reply);
    renderHistory();

    isThinking = false;
    updateSendButton();
    scrollToBottom();
  }, delay);
}

function updateSendButton() {
  sendBtn.disabled = !input.value.trim() || isThinking;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
}

function closeMobileSidebar() {
  sidebar.classList.remove("open");
  mobileOverlay.classList.remove("visible");
}

function openMobileSidebar() {
  sidebar.classList.add("open");
  mobileOverlay.classList.add("visible");
}

// Send a message.
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  resizeInput();
  updateSendButton();
});

// Enter sends; Shift+Enter creates a new line.
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

// Starter cards.
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt);
  });
});

// New conversation.
$("#newChat").addEventListener("click", createConversation);

$("#homeNav").addEventListener("click", () => {
  currentId = null;
  renderConversation();
  renderHistory();
  closeMobileSidebar();
});

$("#exploreNav").addEventListener("click", () => {
  input.value = "Give me a fun creative idea to explore";
  resizeInput();
  updateSendButton();
  input.focus();
  closeMobileSidebar();
});

// A random prompt idea.
$("#suggestBtn").addEventListener("click", () => {
  const ideas = [
    "Help me plan a personal project",
    "Give me three unusual creative ideas",
    "Teach me a useful new concept",
    "How can I make my daily routine more organised?",
    "Suggest a fun coding project for a beginner"
  ];

  input.value = ideas[Math.floor(Math.random() * ideas.length)];
  resizeInput();
  updateSendButton();
  input.focus();
});

// Clear conversation history.
$("#clearHistory").addEventListener("click", () => {
  if (!conversations.length) {
    showToast("Your history is already empty.");
    return;
  }

  const confirmed = window.confirm("Clear all saved conversations?");
  if (!confirmed) return;

  conversations = [];
  currentId = null;
  isThinking = false;
  removeTyping();
  saveConversations();
  renderHistory();
  renderConversation();
  updateSendButton();
  showToast("Conversation history cleared.");
});

// Theme toggle.
$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  const light = document.body.classList.contains("light");
  $("#themeToggle").textContent = light ? "☾" : "☼";
  $("#themeToggle").setAttribute(
    "aria-label",
    light ? "Switch to dark theme" : "Switch to light theme"
  );

  try {
    localStorage.setItem("my-ai-studio-theme", light ? "light" : "dark");
  } catch {
    // Theme still works for this session if storage is unavailable.
  }
});

// Mobile navigation.
$("#menuBtn").addEventListener("click", openMobileSidebar);
$("#closeSidebar").addEventListener("click", closeMobileSidebar);
mobileOverlay.addEventListener("click", closeMobileSidebar);

// Keyboard shortcut: Ctrl/Cmd + K creates a new conversation.
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    createConversation();
  }

  if (event.key === "Escape") {
    closeMobileSidebar();
  }
});

// Restore theme.
try {
  if (localStorage.getItem("my-ai-studio-theme") === "light") {
    document.body.classList.add("light");
    $("#themeToggle").textContent = "☾";
    $("#themeToggle").setAttribute("aria-label", "Switch to dark theme");
  }
} catch {
  // Default to dark theme.
}

// Start with a fresh welcome screen. Saved chats remain in the sidebar.
renderHistory();
renderConversation();
updateSendButton();