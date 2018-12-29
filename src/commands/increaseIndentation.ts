import * as vscode from 'vscode';
import {
	todoLanguageId,
	projectRegEx,
	taskRegEx,
} from "../config";

import {
	getSelectedLineIndices,
	getIndentationString,
} from "../utils";

export default function SubscribeIncreaseIndentation(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.increaseIndentation', () => {

		const editor = vscode.window.activeTextEditor;

		if (editor && editor.document.languageId === todoLanguageId) {

			const linesToCheck = getSelectedLineIndices(editor);
			const indentationString = getIndentationString(editor);

			editor.edit((edit) => {
				linesToCheck.forEach((lineIndex: number) => {
					const line = editor.document.lineAt(lineIndex);
	
					if (
						!line.isEmptyOrWhitespace &&
						line.text.length > 2 &&
						(
							line.text.match(projectRegEx) !== null ||
							line.text.match(taskRegEx) !== null
						)
					) {
						edit.insert(
							new vscode.Position(lineIndex, 0),
							indentationString,
						);
					}
				});
			});
		}
	}));
}