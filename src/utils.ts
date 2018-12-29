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

export function moveCursorToLineStart(editor: vscode.TextEditor): void {
	const newCursorPosition = new vscode.Position(
		editor.selection.end.line,
		0,
	);
	var newSelection = new vscode.Selection(newCursorPosition, newCursorPosition);
	editor.selection = newSelection;
}