import * as vscode from 'vscode';

const doneTaskDecorationType = vscode.window.createTextEditorDecorationType({
  opacity: "0.2",
});

const projectNameDecorationType = vscode.window.createTextEditorDecorationType({
  fontWeight: "bold",
});

export default function RunTaskDecorations(context: vscode.ExtensionContext) {

  let timeout : NodeJS.Timer | null = null;
  
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations();
  }
  
  vscode.window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);
  
  vscode.workspace.onDidChangeTextDocument(event => {
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
		const text = activeEditor.document.getText();

		let match;

		const doneTaskRegEx = /- .+@done/g;
		const doneTaskDecorations: vscode.DecorationOptions[] = [];
		while (match = doneTaskRegEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'done task' };
				doneTaskDecorations.push(decoration);
		}
		activeEditor.setDecorations(doneTaskDecorationType, doneTaskDecorations);

		const projectRegEx = /^[ \t]*[a-zA-z0-9]+:$/gm;
		const projectDecorations: vscode.DecorationOptions[] = [];
		while (match = projectRegEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'project' };
			projectDecorations.push(decoration);
		}
		activeEditor.setDecorations(projectNameDecorationType, projectDecorations);
	}
}