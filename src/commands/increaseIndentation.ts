import {
  ExtensionContext,
  commands,
  window,
  Position,
} from "vscode";
import {
  todoLanguageId,
} from "../config";

import {
  getSelectedLineIndices,
  getIndentationString,
} from "../utils";

export default function SubscribeIncreaseIndentation(context: ExtensionContext) {

  context.subscriptions.push(commands.registerCommand("extension.increaseIndentation", () => {

    const editor = window.activeTextEditor;

    if (editor && editor.document.languageId === todoLanguageId) {

      const linesToCheck = getSelectedLineIndices(editor);
      const indentationString = getIndentationString(editor);

      editor.edit((edit) => {
        linesToCheck.forEach((lineIndex: number) => {
          edit.insert(
            new Position(lineIndex, 0),
            indentationString,
          );
        });
      });
    }
  }));
}
