import {ExtensionContext} from "vscode";
import RunTaskDecorations from "./taskDecorations";

import SubscribeToggleDone from "./commands/toggleDone";
import SubscribeNewLine from "./commands/newLine";
import SubscribeArchiveDoneTasks from "./commands/archiveDoneTasks";
import SubscribeIncreaseIndentation from "./commands/increaseIndentation";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

  RunTaskDecorations(context);

  SubscribeToggleDone(context);
  SubscribeNewLine(context);
  SubscribeArchiveDoneTasks(context);
  SubscribeIncreaseIndentation(context);
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() {}
