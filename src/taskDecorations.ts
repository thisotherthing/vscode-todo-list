import * as vscode from 'vscode';
import {
	todoLanguageId,
	projectRegEx,
	doneTaskRegEx,
} from "./config";

const doneTaskDecorationType = vscode.window.createTextEditorDecorationType({
	opacity: "0.2",
});

const projectNameDecorationType = vscode.window.createTextEditorDecorationType({
	fontWeight: "bold",
});

export default function RunTaskDecorations(context: vscode.ExtensionContext) {

	let timeout : NodeJS.Timer | null = null;
	
	let activeEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

	if (activeEditor) {
		triggerUpdateDecorations();
	}
	
	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		if (editor !== undefined && editor.document.languageId !== todoLanguageId) {
			return;
		}

		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateDecorations, 250);
	}
	
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		if (activeEditor !== undefined && activeEditor.document.languageId !== todoLanguageId) {
			return;
		}

		const text = activeEditor.document.getText();

		let match;

		const doneTaskDecorations: vscode.DecorationOptions[] = [];
		while (match = doneTaskRegEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'done task' };
				doneTaskDecorations.push(decoration);
		}
		activeEditor.setDecorations(doneTaskDecorationType, doneTaskDecorations);

		const projectDecorations: vscode.DecorationOptions[] = [];
		while (match = projectRegEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'project' };
			projectDecorations.push(decoration);
		}
		activeEditor.setDecorations(projectNameDecorationType, projectDecorations);
	}
}