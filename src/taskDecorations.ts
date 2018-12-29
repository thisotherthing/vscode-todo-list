import {
  window,
  ExtensionContext,
  TextEditor,
  workspace,
  DecorationOptions,
  Range,
} from "vscode";
import {
  todoLanguageId,
  projectRegEx,
  doneTaskRegEx,
} from "./config";

const doneTaskDecorationType = window.createTextEditorDecorationType({
  opacity: "0.2",
});

const projectNameDecorationType = window.createTextEditorDecorationType({
  fontWeight: "bold",
});

export default function RunTaskDecorations(context: ExtensionContext) {

  let timeout: NodeJS.Timer | null = null;

  let activeEditor: TextEditor | undefined = window.activeTextEditor;

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  window.onDidChangeActiveTextEditor((editor: TextEditor | undefined) => {
    if (editor !== undefined && editor.document.languageId !== todoLanguageId) {
      return;
    }

    activeEditor = editor;
    if (editor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  workspace.onDidChangeTextDocument((event) => {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(updateDecorations, 250);
  }

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    if (activeEditor !== undefined && activeEditor.document.languageId !== todoLanguageId) {
      return;
    }

    const text = activeEditor.document.getText();

    let match;

    const doneTaskDecorations: DecorationOptions[] = [];
    match = doneTaskRegEx.exec(text);
    while (match) {
      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.positionAt(match.index + match[0].length);
      const decoration = { range: new Range(startPos, endPos), hoverMessage: "done task" };
      doneTaskDecorations.push(decoration);

      match = doneTaskRegEx.exec(text);
    }
    activeEditor.setDecorations(doneTaskDecorationType, doneTaskDecorations);

    const projectDecorations: DecorationOptions[] = [];
    match = projectRegEx.exec(text);
    while (match) {
      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.positionAt(match.index + match[0].length);
      const decoration = { range: new Range(startPos, endPos), hoverMessage: "project" };
      projectDecorations.push(decoration);

      match = projectRegEx.exec(text);
    }
    activeEditor.setDecorations(projectNameDecorationType, projectDecorations);
  }
}
