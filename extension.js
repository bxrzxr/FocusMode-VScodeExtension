const vscode = require('vscode');

let timer = null;
let remainingTime = 0;
let focusActive = false;
let statusBarItem;


function activate(context) {
    console.log('✅ Focus Mode activated');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'focusMode.toggle';
    context.subscriptions.push(statusBarItem);


    let disposable = vscode.commands.registerCommand('focusMode.toggle', () => {
        if (!focusActive) {
            vscode.window.showInputBox({ prompt: 'Введите время фокус-сессии (в минутах)', placeHolder: 'например: 25' })
                .then(value => startFocus(value));
        } else {
            stopFocusMode();
        }
    });

    context.subscriptions.push(disposable);
}


function startFocus(value) {
    if (!value) {
        vscode.window.showInformationMessage('⏹ Время не указано.');
        return;
    }

    let minutes = parseInt(value);
    if (isNaN(minutes) || minutes <= 0) {
        vscode.window.showErrorMessage('Введите корректное число минут.');
        return;
    }

    focusActive = true;
    remainingTime = minutes * 60;
    vscode.window.showInformationMessage(`💡 Focus Mode запущен на ${minutes} минут.`);
    vscode.commands.executeCommand('workbench.action.closeSidebar');
    vscode.commands.executeCommand('workbench.action.closePanel');

    updateStatusBar();

    timer = setInterval(() => {
        remainingTime--;
        updateStatusBar();
        if (remainingTime <= 0) {
            vscode.window.showInformationMessage('⏰ Время фокусировки закончилось!');
            stopFocusMode();
        }
    }, 1000);
}


function stopFocusMode() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    focusActive = false;
    if (statusBarItem) statusBarItem.hide();
    vscode.window.showInformationMessage('🛑 Focus Mode остановлен.');
}


function updateStatusBar() {
    if (!statusBarItem) return;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    statusBarItem.text = `⏳ Focus: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarItem.show();
}


function deactivate() {
    stopFocusMode();
}

module.exports = { activate, deactivate };
