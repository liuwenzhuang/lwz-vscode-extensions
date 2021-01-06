import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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
  /**
   * workspace 路径
   */
  const rootPath = workspace.uri.fsPath;

  /**
   * 选择的文件列表
   */
  const selectedFileUris = await vscode.window.showOpenDialog({
    defaultUri: state.defaultUri[workspace.name],
    canSelectMany: true,
    filters: {
      images: ['png', 'jpg', 'jpeg', 'svg'],
    },
  });
  if (!selectedFileUris) {
    return;
  }

  const firstFile = selectedFileUris[0];
  const firstFilePath = firstFile.fsPath;
  const beyondWorkspace = firstFilePath.indexOf(rootPath) === -1;
  let isBeyondFilesCopied = false;
  if (beyondWorkspace) {
    // 不是当前workspace下的路径
    const result = await vscode.window.showWarningMessage(
      '文件不在当前工程下，拷贝到当前工程下...',
      'Confirm',
      'Cancel'
    );
    if (result === 'Confirm') {
      isBeyondFilesCopied = true;
      selectedFileUris.forEach((fileUri) => {
        const filePath = fileUri.fsPath;
        const fileName = path.basename(filePath);
        try {
          fs.copyFileSync(filePath, path.join(rootPath, fileName));
        } catch (err) {
          vscode.window.showErrorMessage(err.message);
          isBeyondFilesCopied = false;
        }
      });
    }
  }

  if (beyondWorkspace && !isBeyondFilesCopied) {
    return;
  }

  /**
   * 待插入的文本
   */
  let snippetStr = '';

  selectedFileUris.forEach((fileUri, index) => {
    const filePath = fileUri.fsPath;
    let unixPath = '';
    let fileName = path.basename(filePath);
    if (beyondWorkspace) {
      unixPath = `/${fileName}`;
    } else {
      // 处于当前workspace下的路径
      const relativePath = path.relative(rootPath, filePath);
      unixPath = '/' + relativePath.replace(/\\/g, '/');
    }

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
