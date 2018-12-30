import {
  commands,
  window,
  ExtensionContext,
  Position,
  Selection,
  Range,
} from "vscode";
import {
  todoLanguageId,
  projectRegEx,
  taskRegEx,
} from "../config";

import {
  getEOLChar,
  getIndentationString,
  moveCursorToLineStart,
} from "../utils";

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

export default function SubscribeNewLine(context: ExtensionContext) {

  context.subscriptions.push(commands.registerCommand("extension.newLine", () => {

    const editor = window.activeTextEditor;

    if (editor && editor.document.languageId === todoLanguageId) {

      const linesToCheckDictionary = {};

      editor.selections.forEach((selection) => {
        addLines(selection.start.line, selection.end.line, linesToCheckDictionary);
      });

      const linesToCheck =
        Object.keys(linesToCheckDictionary)
        .map((valueString) => parseInt(valueString, 10))
        .reverse();

      const indentationString = getIndentationString(editor);

      let moveCursor = false;

      const eol = getEOLChar(editor.document);

      editor.edit((edit) => {
        linesToCheck.forEach((lineIndex: number) => {
          const line = editor.document.lineAt(lineIndex);

          const currentIndentationString = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

          const itemStartMatch = line.text.match(taskRegEx);

          const newLineNeedsEOLBefore = lineIndex === editor.document.lineCount - 1;

          // indent on project name line
          if (line.text.match(projectRegEx) !== null) {
            moveCursor = true;

            // if there is no eol, move cursor, so it isn't shifted by the inserted line
            if (newLineNeedsEOLBefore) {
              moveCursorToLineStart(editor);
            }

            const newLineString =
              `${newLineNeedsEOLBefore ? eol : ""}${currentIndentationString}${indentationString}- ${eol}`;

            edit.insert(
              new Position(lineIndex + 1, 0),
              newLineString,
            );
          } else if (line.text.match(/^[\t ]+- $/gm) !== null) {
            // if there is just an empty task, remove it
            edit.delete(line.range);
          } else if (itemStartMatch !== null) {
            moveCursor = true;

            let insetLineBelow = true;

            // if cursor isn't at end, split line into two tasks
            let textAfterCursor = "";
            const lineSelection = editor.selections.filter((selection) => selection.start.line === lineIndex);

            if (lineSelection.length > 0) {
              const cursorCharacterIndex = lineSelection[0].start.character;

              // check if cursor is before `-`, then insert empty line before
              if (line.text.indexOf("-") >= cursorCharacterIndex) {
                edit.insert(
                  new Position(lineIndex, 0),
                  eol,
                );
                insetLineBelow = false;
                moveCursor = false;
              } else {
                textAfterCursor = line.text.substr(cursorCharacterIndex);
                edit.delete(new Range(
                  new Position(lineIndex, cursorCharacterIndex),
                  new Position(lineIndex, line.range.end.character),
                ));

                // if there is no eol, move cursor, so it isn't shifted by the inserted line
                if (newLineNeedsEOLBefore) {
                  moveCursorToLineStart(editor);
                }

                edit.insert(
                  new Position(lineIndex + 1, 0),
                  `${newLineNeedsEOLBefore ? eol : ""}${itemStartMatch[0]}${textAfterCursor.trimLeft()}${eol}`,
                );
              }
            }
          } else {
            moveCursor = true;

            // if there is no eol, move cursor, so it isn't shifted by the inserted line
            if (newLineNeedsEOLBefore) {
              moveCursorToLineStart(editor);
            }

            edit.insert(
              new Position(lineIndex + 1, 0),
              eol,
            );
          }
        });
      }).then(() => {
        // after inserts are finished, move cursor to new line
        if (moveCursor) {
          const newCursorPosition = new Position(
            editor.selection.end.line + 1,
            editor.document.lineAt(editor.selection.end.line).text.length,
          );
          const newSelection = new Selection(newCursorPosition, newCursorPosition);
          editor.selection = newSelection;
        }
      });
    }
  }));
}
