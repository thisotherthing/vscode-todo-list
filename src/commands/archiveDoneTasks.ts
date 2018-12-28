import * as vscode from 'vscode';
import {
	todoLanguageId,
	projectRegEx,
	doneTaskRegEx,
} from "../config";


export default function SubscribeArchiveDoneTasks(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.archiveDoneTasks', () => {

		const editor = vscode.window.activeTextEditor;

		if (editor && editor.document.languageId === todoLanguageId) {

			const linesToMove: vscode.TextLine[] = [];


			editor.edit((edit) => {
				// edit.replace(line.range, line.text.replace(/ +@done/g, ""));
				for (let i = 0, l = editor.document.lineCount; i < l; i++) {
					const line = editor.document.lineAt(i);

					if (
						!line.isEmptyOrWhitespace &&
						line.text.match(doneTaskRegEx) !== null
					) {
						linesToMove.push(line);
						// console.log(line);
					}

					if (
						!line.isEmptyOrWhitespace &&
						line.text.match(/[aA]rchive:/g) !== null
					) {
						const eol = editor.document.getText(new vscode.Range(
							line.range.end,
							line.rangeIncludingLineBreak.end,
						));

						linesToMove.forEach(doneTaskLine => {
							edit.insert(
								new vscode.Position(line.range.end.line + 1, 0),
								`${doneTaskLine.text}${eol}`,
							);
						});

						linesToMove.forEach(doneTaskLine => {
							edit.delete(
								doneTaskLine.rangeIncludingLineBreak
							);
						});

						break;
					}
				}
			});
		}
	}));
}