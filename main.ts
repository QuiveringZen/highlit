import { Plugin } from 'obsidian'
import * as CodeMirror from 'codemirror'

export default class HighlitPlugin extends Plugin {
    private readonly codeMirrorEditors: CodeMirror.Editor[] = [];
    private previousCursorPosition: CodeMirror.Position = undefined;

    private readonly registerPreviousCursor = (editor: CodeMirror.Editor) => this.previousCursorPosition = editor.getCursor();

    private readonly handleKeyup = (editor: CodeMirror.Editor, _e: KeyboardEvent) => this.registerPreviousCursor(editor);
    private readonly handleKeydown = (editor: CodeMirror.Editor, _e: KeyboardEvent) => this.replaceWhileTyping(editor);

    async onload() {
        super.onload();

        this.registerCodeMirror((editor) => {
            this.codeMirrorEditors.push(editor);
            editor.on('keyup', this.handleKeyup);
            editor.on('keydown', this.handleKeydown);
        });
    }

    onunload() {
        super.onunload();

        this.codeMirrorEditors.forEach((editor) => {
            editor.off('keyup', this.handleKeyup);
            editor.off('keydown', this.handleKeydown);
        });
    }

    private replaceWhileTyping(editor: CodeMirror.Editor) {
        if (!this.previousCursorPosition) {
            return;
        }

        const currentCursorPosition: CodeMirror.Position = editor.getCursor();

        const cursorDiff: number = currentCursorPosition.ch - this.previousCursorPosition.ch;
        const isSameCursor: boolean =
            currentCursorPosition.line === this.previousCursorPosition.line
            && (cursorDiff === 0 || cursorDiff === 1);

        if (isSameCursor) {
            const token: CodeMirror.Token = editor.getTokenAt(currentCursorPosition);

            if (token.string === ':') {
                const line: number = currentCursorPosition.line;
                const lineText: string = editor.getLine(line);
                const isLineAlreadyBolded: boolean = lineText.startsWith('**');

                if (!isLineAlreadyBolded) {
                    editor.replaceRange(
                        `**${lineText}**`,
                        {line: line, ch: 0},
                        {line: line, ch: token.end});
                }
            }
        }
    }
}
