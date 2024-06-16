// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");
const { ChatOpenAI } = require("@langchain/openai");

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
  streaming: false,
});

contextBridge.exposeInMainWorld("api", {
  onTextSelected: (callback) =>
    ipcRenderer.on("selected-text", (event, text) => {
      return callback(text);
    }),

  getLLMResponse: async (selectedText) => {
    try {
      const prompt = `You are a Gen Z who knows all the latest trends. You are chatting with a friend who is a boomer and doesn't know what gen z slang means. 
      Your friend asks you, "${selectedText}". How would you explain it to them? You also have access to the internet to look up information.
        Only include the description of the slang term. Do not include the slang term itself.
      `;
      const result = await llm.invoke(prompt);
      return result.content;
    } catch (e) {
      return "Error fetching response. Please try again later.";
    }
  },
});
