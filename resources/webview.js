const vscode = acquireVsCodeApi();

// post message to the extension
// vscode.postMessage({ message: "test" });

// receive messages from the extension
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    window.alert(message);
});

function sendSingleParam(name, value) {
    vscode.postMessage({
        "name": name,
        "value": value
    });
}

document.querySelectorAll("[data-page]").forEach(function (element) {
    element.addEventListener('click', function (_event) {
        let pageName = element.getAttribute('data-page');
        sendSingleParam("page", pageName);
    });
});