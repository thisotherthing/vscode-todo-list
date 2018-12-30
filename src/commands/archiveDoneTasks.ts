import {
  TextLine,
  Position,
  TextDocument,
  TextEditorEdit,
  ExtensionContext,
  commands,
  window,
  TextEditor,
} from "vscode";
import {
  todoLanguageId,
  doneTaskRegEx,
} from "../config";

import {
  getEOLCharFromLine,
} from "../utils";

import {
  ITreeData,
  getItemTree,
} from "../itemTreeParser";

const moveArchiveLines = (
  linesToMove: TextLine[],
  lineInsertPosition: Position,
  document: TextDocument,
  edit: TextEditorEdit,
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
  document: TextDocument,
  edit: TextEditorEdit,
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

const filterLinesToArchive = (
  linesToMove: TextLine[],
  editor: TextEditor,
): TextLine[] => {
  const itemTree = getItemTree(editor);

  const filteredLines = linesToMove.filter((line) => itemTree.lineMap[line.lineNumber].archivable === true);

  return filteredLines;
};

export default function SubscribeArchiveDoneTasks(context: ExtensionContext) {

  context.subscriptions.push(commands.registerCommand("extension.archiveDoneTasks", () => {

    const editor = window.activeTextEditor;

    if (editor && editor.document.languageId === todoLanguageId) {

      const linesToMove: TextLine[] = [];
      let foundArchiveLine: TextLine;

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
            foundArchiveLine = line;

            break;
          }
        }

        const filteredLinesToMove = filterLinesToArchive(
          linesToMove,
          editor,
        );

        if (foundArchiveLine === undefined) {
          addMissingArchiveProjectToEnd(editor.document, edit);

          // and add done tasks to new archive project
          const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
          moveArchiveLines(
            filteredLinesToMove,
            new Position(lastLine.range.end.line + 1, 0),
            editor.document,
            edit,
          );
        } else {
          moveArchiveLines(
            filteredLinesToMove,
            new Position(foundArchiveLine.range.end.line + 1, 0),
            editor.document,
            edit,
          );
        }
      });
    }
  }));
}
