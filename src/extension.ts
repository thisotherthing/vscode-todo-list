import * as vscode from 'vscode';
import RunTaskDecorations from './taskDecorations';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	RunTaskDecorations(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
