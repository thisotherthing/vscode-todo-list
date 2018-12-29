import * as vscode from 'vscode';

export function getEOLCharFromLine(
	line: vscode.TextLine,
	document: vscode.TextDocument,
): string {
	return document.getText(new vscode.Range(
		line.range.end,
		line.rangeIncludingLineBreak.end,
	));
}