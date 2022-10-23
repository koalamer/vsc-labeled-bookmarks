const vscode = acquireVsCodeApi();

// post message to the extension
// vscode.postMessage({ message: "test" });

// receive messages from the extension
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent

    switch (message.operation) {
        case "set":
            document.querySelectorAll("[name=" + message.elementName + "]")
                .forEach(function (element) {
                    element.value = message.value;
                });
            break;
        case "setHtml":
            document.querySelectorAll(message.selector).forEach(function (element) {
                element.innerHTML = message.html;
            });
            break;
        case "submit":
            sendSingleParam("submit-pre", null, null);
            submitForm("remoteTriggered");
            break;
        default:
            throw new Error("Unknown operation");
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

function submitForm(submitter) {
    sendSingleParam("submit-start", null, null);
    let form = document.querySelector(`form[name=VSCLBForm]`);
    const valueGroupPrefix = "valueGroup.";
    const mappingPrefix = "mapping.";

    let formData = {};

    sendSingleParam("submit-formdata", null, null);

    new FormData(form).forEach((value, key) => {
        if (key.startsWith(valueGroupPrefix)) {
            let prefixLength = valueGroupPrefix.length;
            let groupNameEndPos = key.indexOf(".", prefixLength);

            if (groupNameEndPos === -1) {
                formData[key] = value;
                return;
            }

            let groupName = key.substring(prefixLength, groupNameEndPos);
            let groupKey = key.substring(groupNameEndPos + 1);
            if (typeof formData[groupName] === "undefined") {
                formData[groupName] = new Array();
            }

            formData[groupName].push(groupKey);
            return;
        }

        if (key.startsWith(mappingPrefix)) {
            let prefixLength = mappingPrefix.length;
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

            formData[groupName][groupKey] = value;
            return;
        }

        formData[key] = value;
    });
    sendSingleParam("submit", submitter, JSON.stringify(formData));
}

document.querySelectorAll(".submit").forEach(function (submitElement) {
    submitElement.addEventListener('click', function (_event) {
        submitForm(submitElement.value);
    });
});