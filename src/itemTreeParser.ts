import {
  TextEditor,
  TextLine,
} from "vscode";

import {
  projectRegEx,
  doneTaskRegEx,
} from "./config";

import {
  getIndentationString,
  leftPad,
} from "./utils";

export interface ITodoItem {
  line?: TextLine;
  lineIndex: number;
  projectName?: string;
  isDone: boolean;
  parent?: ITodoItem;
  children: ITodoItem[];
  archivable?: boolean;
}

export interface ITodoItemMap {
  [key: number]: ITodoItem;
}

export interface ITreeData {
  root: ITodoItem;
  lineMap: ITodoItemMap;
}

const resursiveAddItem = (
  item: ITodoItem,
  depth: number,
  stringbuilder: string[],
  substringBuilder: string[],
  debug: boolean,
) => {
  substringBuilder.length = 0;

  if (debug === true) {
    substringBuilder.push(leftPad("00", depth.toString()));
  }

  substringBuilder.push("  ".repeat(Math.max(depth, 0)));

  if (item.line !== undefined) {
    substringBuilder.push(item.line.text.trim());
  }

  if (
    debug === true &&
    item.projectName !== undefined
  ) {
    substringBuilder.push(`(${item.projectName})`);
  }

  if (
    debug === true &&
    item.isDone
  ) {
    substringBuilder.push(`(done)`);
  }

  if (debug && item.archivable === true) {
    substringBuilder.push(`(archivable)`);
  }

  if (debug === true) {
    stringbuilder.push(substringBuilder.join(" "));
  } else {
    stringbuilder.push(substringBuilder.join(""));
  }

  item.children.forEach((child: ITodoItem) => {
    resursiveAddItem(
      child,
      depth + 1,
      stringbuilder,
      substringBuilder,
      debug,
    );
  });
};

export function getNestedString(
  rootItem: ITodoItem,
  debug?: boolean,
): string {
  const stringbuilder: string[] = [];
  const substringBuilder: string[] = [];

  resursiveAddItem(
    rootItem,
    -1,
    stringbuilder,
    substringBuilder,
    debug === true,
  );

  return stringbuilder.join("\n");
}

const areChildrenArchivable = (item: ITodoItem): boolean => {

  const isTodoItem = item.projectName === undefined;

  // stop at archive
  if (
    item.projectName !== undefined &&
    (
      item.projectName === "Archive:" ||
      item.projectName === "archive:"
    )
  ) {
    return false;
  }

  if (!item.isDone && isTodoItem) {
    item.archivable = false;
    return false;
  }

  for (let i = 0, l = item.children.length; i < l; i++) {
    const child = item.children[i];

    if (
      child.line !== undefined &&
      !child.line.isEmptyOrWhitespace &&
      !areChildrenArchivable(item.children[i])
    ) {
      item.archivable = false;

      if (isTodoItem) {
        return false;
      }
    }
  }

  if (isTodoItem) {
    item.archivable = true;
  }

  return true;
};

const setArchivable = (item: ITodoItem) => {
  areChildrenArchivable(item);
};

export function getItemTree(
  editor: TextEditor,
): ITreeData {
  const root: ITodoItem = {
    projectName: "root",
    lineIndex: -1,
    isDone: false,
    archivable: false,
    children: [],
  };
  const todoItemMap: ITodoItemMap = {};

  const indentationString = getIndentationString(editor);
  const indentationStringLength = indentationString.length;
  const indentationRegex = new RegExp(`^${indentationString}+`, "g");

  const getIndentation = (text: string): number => {
    const indentationMatch = text.match(indentationRegex);
    let indentation = 0;

    if (indentationMatch !== null) {
      indentation = indentationMatch[0].length / indentationStringLength;
    }

    return indentation;
  };

  let currentParent: ITodoItem = root;
  let lastItem: ITodoItem = root;
  let currentIndentation = -1;

  for (let i = 0, l = editor.document.lineCount; i < l; i++) {
    const currentLine = editor.document.lineAt(i);
    const lineIndentation = getIndentation(currentLine.text);

    // console.log(currentLine.text);

    const isProject = currentLine.text.match(projectRegEx) !== null;
    const isDone = currentLine.text.match(doneTaskRegEx) !== null;

    const item: ITodoItem = {
      line: currentLine,
      lineIndex: currentLine.lineNumber,
      projectName: isProject ? currentLine.text.trim() : undefined,
      isDone: !isProject && currentLine.text.match(doneTaskRegEx) !== null,
      parent: currentParent,
      children: [],
    };

    if (isProject || !isDone) {
      item.archivable = false;
    }

    todoItemMap[currentLine.lineNumber] = item;

    // don't hanlde empty lines
    if (currentLine.isEmptyOrWhitespace) {
      currentParent.children.push(item);
    } else {
      const indentationDifference = Math.abs(lineIndentation - currentIndentation);

      if (lineIndentation < currentIndentation) {
        // go up parent chain
        // console.log("go up parent chain");
        for (let j = 0; j < indentationDifference; j++) {
          if (currentParent.parent !== undefined) {
            currentParent = currentParent.parent;
          }
          item.parent = currentParent;
        }
        currentParent.children.push(item);
      } else if (lineIndentation > currentIndentation) {
        // console.log("item is child");
        // item is child
        lastItem.children.push(item);
        item.parent = lastItem;
        currentParent = lastItem;
      } else {
        // console.log("same indentation");
        // same indentation
        currentParent.children.push(item);
        item.parent = currentParent;
      }

      currentIndentation = lineIndentation;
      lastItem = item;
    }
  }

  setArchivable(root);

  // console.log(root);
  // console.log(getNestedString(root, true));

  return {
    root,
    lineMap: todoItemMap,
  };
}
