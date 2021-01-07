import * as vscode from 'vscode';

type DefaultUri = {
  [key: string]: vscode.Uri;
};

const state: {
  /**
   * 工作区内各文件夹对应的上一次选择的文件夹
   */
  defaultUri: DefaultUri;
  /**
   * 工作区内各文件夹对应的上一次选择的外部文件保存的目的文件夹
   */
  defaultSaveUri: DefaultUri;
} = {
  defaultUri: {},
  defaultSaveUri: {}
};

export default state;
