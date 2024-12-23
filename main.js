const API_KEY = 'AIzaSyC_hm_dae2-t82ZT-LuztgEV6vUEV5NcIs'; // Replace with your Gemini API key

let currentCategory = '';
let conversationHistory = []; // Stores the conversation history

// DOM Elements
const optionsScreen = document.getElementById('options-screen');
const chatScreen = document.getElementById('chat-screen');
const chatWindow = document.getElementById('chat-window');
const userMessageInput = document.getElementById('user-message');

// Option Selection
document.querySelectorAll('.option-btn').forEach(button => {
    button.addEventListener('click', () => {
        currentCategory = button.getAttribute('data-option');
        startChat(`You selected ${currentCategory}. Please wait for the client's problem statement.`);
        conversationHistory = []; // Reset conversation history
        fetchAIResponse(`Generate a consulting case based on the ${currentCategory} category. The case should follow these steps:
1. Provide a concise problem statement for the consulting case, relevant to the selected category.
2. After the problem statement, the conversation continues with the consultant asking probing questions, seeking more information, and suggesting possible solutions based on the client’s responses.
3. The client should respond with appropriate business details and constraints.
4. Maintain a professional tone and focus on practical solutions.
5. When the problem is identified, tell the consultant that the problem is identified and ask for recommendations.
6. After recommendations are provided by the consultant, say thank you and the conversation is ended.

Start the conversation by providing the problem statement first, and then wait for the consultant to respond with a clarifying question. Respond to the consultant’s question as the client. Act as an administrator throughout the case-solving process and ensure continuity between the client and consultant responses.`);
    });
});

// Start Chat
function startChat(initialMessage) {
    optionsScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    addMessage('client', initialMessage);
}

// Send User Message
document.getElementById('send-btn').addEventListener('click', () => {
    const userMessage = userMessageInput.value.trim();
    if (userMessage) {
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] }); // Add user message to history
        userMessageInput.value = '';
        fetchAIResponse(userMessage);
    }
});

// Fetch AI Response for Case, Hint, or Answer
async function fetchAIResponse(prompt) {
    try {
        // Add the latest prompt to history
        conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: conversationHistory
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0]?.content?.parts[0]?.text || "AI failed to respond.";

        // Format the AI response
        const formattedResponse = formatAIResponse(aiResponse);

        addMessage('client', formattedResponse);

        // Add AI response to history for context
        conversationHistory.push({ role: 'model', parts: [{ text: aiResponse }] });
    } catch (error) {
        console.error('Error:', error);
        addMessage('client', 'Error: Unable to fetch response from AI.');
    }
}

// Add Message to the Chat
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerHTML = text; // Using innerHTML to allow HTML content like <ul> and <li>
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Format AI Response to be structured (bullet points, sections, etc.)
function formatAIResponse(responseText) {
    // Break the response into paragraphs or sections, and format them as bullet points
    const paragraphs = responseText.split('\n').filter(paragraph => paragraph.trim() !== '');
    let formattedText = '';

    paragraphs.forEach(paragraph => {
        // If the paragraph starts with a numbered list, format as bullet points
        if (paragraph.match(/^\d+\./)) {
            formattedText += `<ul><li>${paragraph.replace(/^\d+\.\s*/, '')}</li></ul>`;
        } else {
            // Otherwise, just add it as a paragraph
            formattedText += `<p>${paragraph}</p>`;
        }
    });

    return formattedText;
}

// Hint Button Functionality (Request a Hint from Gemini)
document.getElementById('hint-btn').addEventListener('click', () => {
    const latestMessage = conversationHistory[conversationHistory.length - 1]?.parts[0]?.text || '';
    const hintPrompt = `Provide a hint based on the ongoing conversation: "${latestMessage}". Keep it relevant to the case.`;
    fetchAIResponse(hintPrompt);
});

// Answer Button Functionality (Request an Answer from Gemini)
document.getElementById('answer-btn').addEventListener('click', () => {
    const latestMessage = conversationHistory[conversationHistory.length - 1]?.parts[0]?.text || '';
    const answerPrompt = `Provide an answer to the case based on the ongoing conversation: "${latestMessage}". Focus on actionable recommendations for the consultant.`;
    fetchAIResponse(answerPrompt);
});

// Change Problem Button Functionality
document.getElementById('change-problem-btn').addEventListener('click', () => {
    optionsScreen.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    conversationHistory = []; // Reset conversation history
    addMessage('client', 'You have chosen to change the problem. Please select a new category.');
});

// Clear Chat Button Functionality (Clear chat content but keep history intact)
document.getElementById('clear-chat-btn').addEventListener('click', () => {
    // Clear chat window content (messages) but retain conversation history
    chatWindow.innerHTML = '';
});
