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
  projectName?: string;
  isDone: boolean;
  parent?: ITodoItem;
  children: ITodoItem[];
}

const resursiveAddItem = (
  item: ITodoItem,
  depth: number,
  stringbuilder: string[],
  substringBuilder: string[],
  debug?: boolean,
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
    substringBuilder.push(`(${item.isDone})`);
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
    );
  });
};

export function getNestedString(
  rootItem: ITodoItem,
): string {
  const stringbuilder: string[] = [];
  const substringBuilder: string[] = [];

  resursiveAddItem(
    rootItem,
    -1,
    stringbuilder,
    substringBuilder,
  );

  return stringbuilder.join("\n");
}

export function getItemTree(
  editor: TextEditor,
): ITodoItem {
  const root: ITodoItem = {
    projectName: "root",
    isDone: false,
    children: [],
  };
  const todoItemMap: {
    [key: number]: ITodoItem,
  } = {};

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

    const item: ITodoItem = {
      line: currentLine,
      projectName: isProject ? currentLine.text.trim() : undefined,
      isDone: !isProject && currentLine.text.match(doneTaskRegEx) !== null,
      parent: currentParent,
      children: [],
    };

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

  // console.log(root);
  // getNestedString(root);

  return root;
};
