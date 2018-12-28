import * as vscode from 'vscode';

export default function RunTaskDecorations(context: vscode.ExtensionContext) {

  let timeout : NodeJS.Timer | null = null;

  const doneTaskDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: "0.2",
    // borderWidth: '1px',
    // borderStyle: 'solid',
    // overviewRulerColor: 'blue',
    // overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
      // this color will be used in light color themes
      // borderColor: 'darkblue'
    },
    dark: {
      // this color will be used in dark color themes
      // borderColor: 'lightblue'
    }
  });
  
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
    timeout = setTimeout(updateDecorations, 500);
  }
  
  function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const doneTaskRegEx = /- .+@done/g;
		const text = activeEditor.document.getText();
		const doneTaskDecorations: vscode.DecorationOptions[] = [];

		let match;
		while (match = doneTaskRegEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'done task' };
				doneTaskDecorations.push(decoration);
		}
		activeEditor.setDecorations(doneTaskDecorationType, doneTaskDecorations);
	}
}