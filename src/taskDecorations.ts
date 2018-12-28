import * as vscode from 'vscode';

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

const projectNameDecorationType = vscode.window.createTextEditorDecorationType({
  fontWeight: "bold",
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
    timeout = setTimeout(updateDecorations, 500);
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