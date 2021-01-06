import * as vscode from 'vscode';

type DefaultUri = {
  [key: string]: vscode.Uri;
};

const state: {
  defaultUri: DefaultUri;
} = {
  defaultUri: {},
};

export default state;
