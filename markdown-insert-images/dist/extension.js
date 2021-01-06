module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const insert_img_1 = __webpack_require__(1);
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "markdown-insert-images" is now active!');
    context.subscriptions.push(insert_img_1.insertImgPath());
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.insertImgPath = void 0;
const vscode = __webpack_require__(2);
const path = __webpack_require__(3);
function insertImgPath() {
    return vscode.commands.registerTextEditorCommand('markdown-insert-images.insertImgPath', (textEditor) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }
        const activeDocFilePath = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.fileName;
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
    }));
}
exports.insertImgPath = insertImgPath;
/**
 * 打开图片选择弹窗
 * @param textEditor
 * @param workspace
 */
function openImgPicker(textEditor, workspace) {
    return __awaiter(this, void 0, void 0, function* () {
        const rootPath = workspace.uri.fsPath;
        const selectedFilePath = yield vscode.window.showOpenDialog({
            defaultUri: workspace.uri,
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
            snippetStr += `![\${${index + 1}:${fileName}}](${unixPath})\n\n`;
        });
        snippetStr += '$0';
        const snippet = new vscode.SnippetString(snippetStr);
        textEditor.insertSnippet(snippet);
    });
}


/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("vscode");;

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })()
;
//# sourceMappingURL=extension.js.map