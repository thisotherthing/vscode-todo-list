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

  const filteredLines = linesToMove.filter((line) => checkIfLineCanBeArchived(
    line.lineNumber,
    itemTree,
  ));

  return filteredLines;
};

const checkIfLineCanBeArchived = (
  lineIndex: number,
  treeData: ITreeData,
): boolean => {
  const todoItem = treeData.lineMap[lineIndex];

  // console.log(lineIndex, treeData.lineMap[lineIndex].line);

  if (
    !todoItem.isDone || // stop if task isn't done
    todoItem.archivable === false || // was already determinded to not be archivable
    todoItem.projectName !== undefined // is a project
  ) {
    // console.log("0");
    todoItem.archivable = false;
    return false;
  }

  // stop if parent is unfinished task
  if (
    todoItem.parent !== undefined &&
    todoItem.parent.projectName === undefined &&
    !todoItem.parent.isDone
  ) {
    // console.log("1");
    todoItem.archivable = false;
    return false;
  }

  // stop if there are undone children
  if (todoItem.children.length > 0) {
    for (let i = 0, l = todoItem.children.length; i < l; i++) {
      if (
        !todoItem.children[i].isDone ||
        todoItem.children[i].archivable === false
      ) {
        todoItem.archivable = false;
        // console.log("2");
        return false;
      }
    }
  }

  // if parent isn't project and there are undone siblings
  if (
    todoItem.parent !== undefined &&
    todoItem.parent.projectName === undefined &&
    todoItem.parent.children.length > 1
  ) {
    for (let i = 0, l = todoItem.parent.children.length; i < l; i++) {
      if (
        !todoItem.parent.children[i].isDone ||
        todoItem.parent.children[i].archivable === false
      ) {
        // console.log("3");
        todoItem.archivable = false;
        return false;
      }
    }
  }

  return true;
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
