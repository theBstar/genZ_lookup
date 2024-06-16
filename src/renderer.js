import "./index.css";

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  window.api.onTextSelected(async (selectedText) => {
    if (selectedText) {
      let content = `
      <div>
        <h3>Selected Text:</h3>
        <p>${selectedText}</p>

        <h3>Gen Z meaning of the selected text:</h3>
        <p>Fetching...</p>
      </div>
        `;
      app.innerHTML = content;
      const llmResult = await window.api.getLLMResponse(selectedText);
      content = `
       <div>
        <h3>Selected Text:</h3>
        <p>${selectedText}</p>

        <h3>Gen Z meaning of the selected text:</h3>
        <p>${llmResult}</p>
      </div>
      `;
      app.innerHTML = content;
    }
  });
});
