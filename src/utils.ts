import * as vscode from 'vscode';

export function getEOLChar(
	document: vscode.TextDocument,
): string {
	const line = document.lineAt(0);

	return document.getText(new vscode.Range(
		line.range.end,
		line.rangeIncludingLineBreak.end,
	));
}

export function getEOLCharFromLine(
	line: vscode.TextLine,
	document: vscode.TextDocument,
): string {
	return document.getText(new vscode.Range(
		line.range.end,
		line.rangeIncludingLineBreak.end,
	));
}

export function getIndentationString(
	editor: vscode.TextEditor,
) {
	return editor.options.insertSpaces ?
		" ".repeat(editor.options.tabSize as any) : // since a getter is used for the options, this should always be a number
		"\t";
}

export function moveCursorToLineStart(
	editor: vscode.TextEditor,
): void {
	const newCursorPosition = new vscode.Position(
		editor.selection.end.line,
		0,
	);
	var newSelection = new vscode.Selection(newCursorPosition, newCursorPosition);
	editor.selection = newSelection;
}

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

export function getSelectedLineIndices(
	editor: vscode.TextEditor,
): number[] {
	const linesToCheckDictionary = {};

	editor.selections.forEach((selection) => {
		addLines(selection.start.line, selection.end.line, linesToCheckDictionary);
	});

	return Object.keys(linesToCheckDictionary).map(	(valueString) => parseInt(valueString, 10)
	);
}
