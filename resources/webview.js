const vscode = acquireVsCodeApi();

// post message to the extension
vscode.postMessage({});

// receive messages from the extension
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
});