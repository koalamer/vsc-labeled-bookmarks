const vscode = acquireVsCodeApi();

// post message to the extension
// vscode.postMessage({ message: "test" });

// receive messages from the extension
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    console.log(message);

    switch (message.operation) {
        case "set":
            document.querySelectorAll("[name=" + message.name + "]").forEach(function (element) {
                element.value = message.value;
            });
            break;
    }
});

function sendSingleParam(operation, name, value) {
    vscode.postMessage({
        "operation": operation,
        "name": name,
        "value": value
    });
}

document.querySelectorAll("[data-page]").forEach(function (element) {
    element.addEventListener('click', function (_event) {
        let pageName = element.getAttribute('data-page');
        sendSingleParam("show", "page", pageName);
    });
});

document.querySelectorAll(".file-selector").forEach(function (element) {
    element.addEventListener('click', function (_event) {
        let fileInputName = element.getAttribute('data-file-input-name');
        let accessType = element.getAttribute('data-access-type');
        sendSingleParam("selectFile", fileInputName, accessType);
    });
});

function submitForm(formName) {
    window.alert(`form[name=${formName}]`);
    let form = document.querySelector(`form[name=${formName}]`);
    let checkboxGroupPrefix = "checkboxGroup.";

    let formData = {};

    new FormData(form).forEach((value, key) => {
        if (key.startsWith(checkboxGroupPrefix)) {
            let prefixLength = checkboxGroupPrefix.length;
            let groupNameEndPos = key.indexOf(".", prefixLength);

            if (groupNameEndPos === -1) {
                formData[key] = value;
                return;
            }

            let groupName = key.substring(prefixLength, groupNameEndPos);
            let groupKey = key.substring(groupNameEndPos + 1);
            if (typeof formData[groupName] === "undefined") {
                formData[groupName] = {};
            }

            formData[groupName][groupKey] = (value === "on");
            return;
        }

        formData[key] = value;
    });
    sendSingleParam("submit", formName, JSON.stringify(formData));
}

document.querySelectorAll(".submit").forEach(function (element) {
    element.addEventListener('click', function (_event) {
        let formName = element.getAttribute("data-form");
        submitForm(formName);
    });
});