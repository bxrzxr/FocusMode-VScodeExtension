const vscode = require('vscode');

let timer = null;
let remainingTime = 0;
let focusActive = false;
let statusBarItem;
let totalDuration = 0; 
let contextGlobal;

function activate(context) {
    

    console.log('✅ Focus Mode extension activated');

    contextGlobal = context;


    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'focusMode.toggle';
    context.subscriptions.push(statusBarItem);


    const disposable = vscode.commands.registerCommand('focusMode.toggle', async () => {
        if (!focusActive) {
            const input = await vscode.window.showInputBox({
                prompt: 'Введите длительность фокус-сессии (в минутах)',
                placeHolder: 'например: 25',
                validateInput: value => {
                    const num = parseInt(value);
                    if (isNaN(num) || num <= 0) return 'Введите положительное число';
                    if (num > 180) return 'Максимум 180 минут';
                    return null;
                }
            });

            if (!input) {
                vscode.window.showInformationMessage('⏹ Focus Mode не запущен (время не указано).');
                return;
            }

            const duration = parseInt(input);
            totalDuration = duration;
            remainingTime = duration * 60;
            focusActive = true;


            await vscode.commands.executeCommand('workbench.action.closeSidebar');
            await vscode.commands.executeCommand('workbench.action.closePanel');

            startTimer();
        } else {
            stopFocusMode();
        }
    });
    context.subscriptions.push(disposable);


    const reportCmd = vscode.commands.registerCommand('focusMode.showReport', () => {
        showReport(context);
    });
    context.subscriptions.push(reportCmd);
}


function startTimer() {
    updateStatusBar();
    vscode.window.showInformationMessage(`💡 Focus Mode включен на ${totalDuration} минут.`);

    timer = setInterval(() => {
        remainingTime--;
        updateStatusBar();

        if (remainingTime <= 0) {
            vscode.window.showInformationMessage('⏰ Время фокусировки закончилось!');
            saveSession(totalDuration);
            stopFocusMode();
        }
    }, 1000);
}


function stopFocusMode() {
    focusActive = false;
    stopTimer();
}


function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (statusBarItem) {
        statusBarItem.hide();
    }
}


function updateStatusBar() {
    if (!statusBarItem) return;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    statusBarItem.text = `⏳ Focus: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarItem.show();
}


function saveSession(duration) {
    const editor = vscode.window.activeTextEditor;
    const fileName = editor ? editor.document.fileName : 'неизвестно';
    let sessions = contextGlobal.globalState.get('focusSessions', []);
    sessions.push({
        date: new Date().toISOString(),
        duration,
        file: fileName
    });
    contextGlobal.globalState.update('focusSessions', sessions);
}


function showReport(context) {
    const panel = vscode.window.createWebviewPanel(
        'focusReport',
        'Focus Mode Report',
        vscode.ViewColumn.One,
        {}
    );

    const sessions = context.globalState.get('focusSessions', []);
    let html = `<h1>Focus Mode Report</h1>`;
    html += `<ul>`;
    sessions.forEach(s => {
        html += `<li>${s.date} - ${s.duration} мин - ${s.file}</li>`;
    });
    html += `</ul>`;
    panel.webview.html = html;
}

function deactivate() {
    stopFocusMode();
}

module.exports = { activate, deactivate };
