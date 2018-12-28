import * as vscode from 'vscode';
import RunTaskDecorations from './taskDecorations';

import SubscribeToggleDone from "./commands/toggleDone";
import SubscribeNewLine from "./commands/newLine";
import SubscribeArchiveDoneTasks from "./commands/archiveDoneTasks";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	RunTaskDecorations(context);

	SubscribeToggleDone(context);
	SubscribeNewLine(context);
	SubscribeArchiveDoneTasks(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
