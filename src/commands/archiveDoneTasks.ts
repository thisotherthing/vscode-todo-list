import * as vscode from "vscode";
import {
  todoLanguageId,
  doneTaskRegEx,
} from "../config";

import {getEOLCharFromLine} from "../utils";

const moveArchiveLines = (
  linesToMove: vscode.TextLine[],
  lineInsertPosition: vscode.Position,
  document: vscode.TextDocument,
  edit: vscode.TextEditorEdit,
) => {
  linesToMove.forEach((doneTaskLine) => {
    const eol = getEOLCharFromLine(doneTaskLine, document);

    edit.insert(
      lineInsertPosition,
      `${doneTaskLine.text}${eol}`,
    );
  });

  linesToMove.forEach((doneTaskLine) => {
    edit.delete(
      doneTaskLine.rangeIncludingLineBreak,
    );
  });
};

const addMissingArchiveProjectToEnd = (
  document: vscode.TextDocument,
  edit: vscode.TextEditorEdit,
) => {
  const lastLine = document.lineAt(document.lineCount - 1);
  const eol = getEOLCharFromLine(
    document.lineAt(0),
    document,
  );

  // insert empty line before archive project, if there isn't one already
  const insertEmptyLineBeforeArchive = !document.lineAt(document.lineCount - 2).isEmptyOrWhitespace;

  const archiveProjectHeader =
    `${!lastLine.isEmptyOrWhitespace ? eol : ""}${insertEmptyLineBeforeArchive ? eol : ""}Archive:${eol}`;
  edit.insert(
    lastLine.rangeIncludingLineBreak.end,
    archiveProjectHeader,
  );
};

export default function SubscribeArchiveDoneTasks(context: vscode.ExtensionContext) {

  context.subscriptions.push(vscode.commands.registerCommand("extension.archiveDoneTasks", () => {

    const editor = vscode.window.activeTextEditor;

    if (editor && editor.document.languageId === todoLanguageId) {

      const linesToMove: vscode.TextLine[] = [];
      let foundArchiveProject = false;

      editor.edit((edit) => {
        // edit.replace(line.range, line.text.replace(/ +@done/g, ""));
        for (let i = 0, l = editor.document.lineCount; i < l; i++) {
          const line = editor.document.lineAt(i);

          if (
            !line.isEmptyOrWhitespace &&
            line.text.match(doneTaskRegEx) !== null
          ) {
            linesToMove.push(line);
          }

          if (
            !line.isEmptyOrWhitespace &&
            line.text.match(/[aA]rchive:/g) !== null
          ) {
            foundArchiveProject = true;

            moveArchiveLines(
              linesToMove,
              new vscode.Position(line.range.end.line + 1, 0),
              editor.document,
              edit,
            );

            break;
          }
        }

        if (!foundArchiveProject) {
          addMissingArchiveProjectToEnd(editor.document, edit);

          // and add done tasks to new archive project
          const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
          moveArchiveLines(
            linesToMove,
            new vscode.Position(lastLine.range.end.line + 1, 0),
            editor.document,
            edit,
          );
        }
      });
    }
  }));
}
