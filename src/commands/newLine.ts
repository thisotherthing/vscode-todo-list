import * as vscode from 'vscode';
import {
	todoLanguageId,
	projectRegEx,
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

export default function SubscribeNewLine(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.newLine', () => {

		const editor = vscode.window.activeTextEditor;

		if (editor && editor.document.languageId === todoLanguageId) {

			const linesToCheckDictionary = {};

			editor.selections.forEach((selection) => {
				addLines(selection.start.line, selection.end.line, linesToCheckDictionary);
			});

			const linesToCheck =
				Object.keys(linesToCheckDictionary)
				.map((valueString) => parseInt(valueString, 10))
				.reverse();

			const indentationString =
				editor.options.insertSpaces ?
				" ".repeat(editor.options.tabSize as any) : // since a getter is used for the options, this should always be a number
				"\t";

			let moveCursor = false;

			editor.edit((edit) => {
				linesToCheck.forEach((lineIndex: number) => {
					const line = editor.document.lineAt(lineIndex);

					const currentIndentationString = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
					const eol = editor.document.getText(new vscode.Range(
						line.range.end,
						line.rangeIncludingLineBreak.end,
					));

					const itemStartMatch = line.text.match(/^ +- /);

					// indent on project name line
					if (line.text.match(projectRegEx) !== null) {
						moveCursor = true;

						const newLineString = `${currentIndentationString}${indentationString}- ${eol}`;

						edit.insert(
							new vscode.Position(lineIndex + 1, 0),
							newLineString,
						);
					} else if (itemStartMatch !== null) {
						moveCursor = true;

						edit.insert(
							new vscode.Position(lineIndex + 1, 0),
							`${itemStartMatch[0]}${eol}`,
						);
					}
				});
			}).then(() => {
				// after inserts are finished, move cursor to new line
				if (moveCursor) {
					const newCursorPosition = new vscode.Position(
						editor.selection.end.line + 1,
						editor.document.lineAt(editor.selection.end.line).text.length,
					);
					var newSelection = new vscode.Selection(newCursorPosition, newCursorPosition);
					editor.selection = newSelection;
				}
			});
		}
	}));
}