// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer, ipcMain } = require("electron");
const { ChatOpenAI } = require("@langchain/openai");

contextBridge.exposeInMainWorld("api", {
  onTextSelected: (callback) =>
    ipcRenderer.on("selected-text", (event, text) => {
      return callback(text);
    }),

  getLLMResponse: async (selectedText) => {
    try {
      const settingsJsonStr = await ipcRenderer.invoke("get-settings");
      const settings = JSON.parse(settingsJsonStr);
      const llm = new ChatOpenAI({
        model: "gpt-3.5-turbo",
        temperature: 0,
        streaming: false,
        apiKey: settings.apiKey,
      });

      const prompt = `${settings.basePrompt} 
      User aks: ${selectedText}`;

      const result = await llm.invoke(prompt);
      return result.content;
    } catch (e) {
      return "Error fetching response. Please try again later.";
    }
  },

  saveSettings: async (settings) => {
    try {
      await ipcRenderer.invoke("save-settings", JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getSettings: async () => {
    try {
      const settingsJsonStr = await ipcRenderer.invoke("get-settings");
      return settingsJsonStr ? JSON.parse(settingsJsonStr) : null;
    } catch (e) {
      console.error(e);
    }
  },
});
