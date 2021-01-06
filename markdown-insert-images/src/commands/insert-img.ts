import * as vscode from 'vscode';
import * as path from 'path';
import state from '../store';

export function insertImgPath() {
  return vscode.commands.registerTextEditorCommand(
    'markdown-insert-images.insertImgPath',
    async (textEditor) => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return;
      }
      const activeDocFilePath = vscode.window.activeTextEditor?.document.fileName;
      if (!activeDocFilePath) {
        return;
      }
      const currentWorkspace = workspaceFolders.find((folder) => {
        const rootPath = folder.uri.fsPath;
        return activeDocFilePath.indexOf(rootPath) !== -1;
      });
      if (currentWorkspace) {
        openImgPicker(textEditor, currentWorkspace);
      }
    }
  );
}

/**
 * 打开图片选择弹窗
 * @param textEditor
 * @param workspace
 */
async function openImgPicker(textEditor: vscode.TextEditor, workspace: vscode.WorkspaceFolder) {
  const workspaceName = workspace.name;
  if (!state.defaultUri || !state.defaultUri[workspaceName]) {
    state.defaultUri[workspaceName] = workspace.uri;
  }
  const rootPath = workspace.uri.fsPath;
  const selectedFilePath = await vscode.window.showOpenDialog({
    defaultUri: state.defaultUri[workspace.name],
    canSelectMany: true,
    filters: {
      images: ['png', 'jpg', 'jpeg', 'svg'],
    },
  });
  if (!selectedFilePath) {
    return;
  }
  let snippetStr = '';
  selectedFilePath.forEach((fileUri, index) => {
    const filePath = fileUri.fsPath;
    const relativePath = path.relative(rootPath, filePath);
    const unixPath = '/' + relativePath.replace(/\\/g, '/');
    const fileName = path.basename(filePath);

    // 记住上一次的文件夹
    const fileDir = path.dirname(filePath);
    const fileDirUri = vscode.Uri.file(fileDir);
    state.defaultUri[workspaceName] = fileDirUri;

    snippetStr += `![\${${index + 1}:${fileName}}](${unixPath})\n\n`;
  });
  snippetStr += '$0';
  const snippet = new vscode.SnippetString(snippetStr);
  textEditor.insertSnippet(snippet);
}
