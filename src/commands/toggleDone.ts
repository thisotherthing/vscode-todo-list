import * as vscode from 'vscode';
import {
	todoLanguageId,
	projectRegEx,
	doneTaskRegEx,
} from "../config";

const addLineToCheck = (
	lineIndex: number,
	lines: {[key: number]: any},
) => {
	if (lines[lineIndex] === undefined) {
		lines[lineIndex] = 0;
	}
};

const addLines = (
	start: number,
	end: number,
	lines: {[key: number]: any},
) => {
	for (let i = start; i <= end; i++) {
		addLineToCheck(i, lines);
	}
};

export default function SubscribeToggleDone(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.toggleDone', () => {

		const editor = vscode.window.activeTextEditor;

		if (editor && editor.document.languageId === todoLanguageId) {

			const linesToCheckDictionary = {};

			editor.selections.forEach((selection) => {
				addLines(selection.start.line, selection.end.line, linesToCheckDictionary);
			});

			const linesToCheck = Object.keys(linesToCheckDictionary).map((valueString) => parseInt(valueString, 10));

			editor.edit((edit) => {
				linesToCheck.forEach((lineIndex: number) => {
					const line = editor.document.lineAt(lineIndex);
	
					if (
						!line.isEmptyOrWhitespace &&
						line.text.length > 2 &&
						line.text.match(projectRegEx) === null
					) {
						// add @done
						if (line.text.match(doneTaskRegEx) === null) {
							edit.replace(line.range, `${line.text.replace(/ +$/gm, "")} @done`);
						}
						// remove @done
						else {
							edit.replace(line.range, line.text.replace(/ +@done/g, ""));
						}
					}
				});
			});
		}
	}));
}