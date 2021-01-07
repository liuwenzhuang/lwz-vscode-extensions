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
  const firstFileDir = path.dirname(firstFilePath);
  /**
   * 当前文件路径相对于workspace根路径的相对路径，用于插入的文本
   */
  let relativePath = path.relative(rootPath, firstFileDir);

  const beyondWorkspace = firstFilePath.indexOf(rootPath) === -1;
  let copyResult:
    | {
        isCopied: boolean;
        relativePath: string;
      }
    | undefined = undefined;
  if (beyondWorkspace) {
    copyResult = await copyFilesToWorkspace(workspace, selectedFileUris);
  }
  if (copyResult) {
    if (!copyResult.isCopied) {
      return;
    }
    relativePath = copyResult.relativePath;
  }

  // 记住上一次打开的文件夹
  state.defaultUri[workspaceName] = vscode.Uri.file(path.dirname(firstFilePath));

  // 如果选择的是根目录下的文件，relativePath就是文件名
  if (relativePath === '') {
    relativePath = '/';
  } else {
    relativePath = '/' + relativePath.replace(/\\/g, '/'); // 插入文档中需转换为unix路径
  }

  textEditor.insertSnippet(getSnippets(relativePath, selectedFileUris));
}

/**
 * 将workspace外的文件复制到当前workspace下的某文件夹
 * @param workspace
 * @param selectedFileUris
 */
async function copyFilesToWorkspace(
  workspace: vscode.WorkspaceFolder,
  selectedFileUris: vscode.Uri[]
) {
  const workspaceUri = workspace.uri;
  const rootPath = workspaceUri.fsPath;
  const workspaceName = workspace.name;
  if (!state.defaultSaveUri || !state.defaultSaveUri[workspaceName]) {
    state.defaultSaveUri[workspaceName] = workspaceUri;
  }

  const defaultSaveUri = state.defaultSaveUri[workspaceName];

  const selectBtn = '选择文件夹' as const;
  const selectPrevBtn = '使用上次选中' as const;
  const cancelBtn = '取消' as const;
  const result = await vscode.window.showWarningMessage(
    `文件不在当前工程下，可选择当前工程内的文件夹进行复制，或直接使用上次选中的文件夹（${defaultSaveUri.fsPath}）。`,
    selectBtn,
    selectPrevBtn,
    cancelBtn
  );
  if (!result || result === cancelBtn) {
    return;
  }

  let copyDestUris: vscode.Uri[] | undefined = [];
  if (result === selectBtn) {
    copyDestUris = await vscode.window.showOpenDialog({
      title: '所选文件将复制到此文件夹下',
      defaultUri: state.defaultSaveUri[workspaceName],
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: '复制',
    });
  }

  if (result === selectPrevBtn) {
    // 使用上一次的文件夹
    copyDestUris = [defaultSaveUri];
  }

  if (!copyDestUris) {
    return;
  }
  const copyDestUri = copyDestUris[0];
  const copyDestPath = copyDestUri.fsPath;
  if (copyDestPath.indexOf(rootPath) === -1) {
    vscode.window.showErrorMessage('请选择当前工程下的文件夹');
    return;
  }

  // 保存选中的目的文件夹
  state.defaultSaveUri[workspaceName] = copyDestUri;

  let isCopied = true;
  let relativePath = '';
  selectedFileUris.forEach((fileUri) => {
    const filePath = fileUri.fsPath;
    const fileName = path.basename(filePath);
    try {
      relativePath = path.relative(rootPath, copyDestPath); // 重新计算相对路径
      const destFilePath = path.join(copyDestPath, fileName); // 文件的目的路径
      fs.copyFileSync(filePath, destFilePath);
    } catch (err) {
      vscode.window.showErrorMessage(err.message);
      isCopied = false;
    }
  });
  return {
    isCopied,
    relativePath,
  };
}

/**
 * 生成插入的文档片段
 * @param relativePath
 * @param selectedFileUris
 */
function getSnippets(relativePath: string, selectedFileUris: vscode.Uri[]) {
  /**
   * 待插入的文本
   */
  let snippetStr = '';

  selectedFileUris.forEach((fileUri, index) => {
    const filePath = fileUri.fsPath;
    let fileName = path.basename(filePath);
    const insertFilePath = path.posix.join(relativePath, fileName);

    snippetStr += `![\${${index + 1}:${fileName}}](${insertFilePath})\n\n`;
  });
  snippetStr += '$0';
  return new vscode.SnippetString(snippetStr);
}
