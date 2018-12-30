import {
  TextDocument,
  TextEditor,
  TextLine,
  Range,
  Position,
  Selection,
} from "vscode";

export function getEOLChar(
  document: TextDocument,
): string {
  const line = document.lineAt(0);

  return document.getText(new Range(
    line.range.end,
    line.rangeIncludingLineBreak.end,
  ));
}

export function getEOLCharFromLine(
  line: TextLine,
  document: TextDocument,
): string {
  return document.getText(new Range(
    line.range.end,
    line.rangeIncludingLineBreak.end,
  ));
}

export function getIndentationString(
  editor: TextEditor,
) {
  return editor.options.insertSpaces ?
    " ".repeat(editor.options.tabSize as any) : // since editor comes from getter, this should always be a number
    "\t";
}

export function moveCursorToLineStart(
  editor: TextEditor,
): void {
  const newCursorPosition = new Position(
    editor.selection.end.line,
    0,
  );
  const newSelection = new Selection(newCursorPosition, newCursorPosition);
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
  editor: TextEditor,
): number[] {
  const linesToCheckDictionary = {};

  editor.selections.forEach((selection) => {
    addLines(selection.start.line, selection.end.line, linesToCheckDictionary);
  });

  return Object.keys(linesToCheckDictionary).map(	(valueString) => parseInt(valueString, 10),
  );
}

// https://stackoverflow.com/a/24398129
export function leftPad(
  pad: string,
  str: string,
) {
  return (pad + str).slice(-pad.length);
}
