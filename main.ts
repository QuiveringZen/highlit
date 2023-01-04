import { Plugin } from 'obsidian';
import * as CodeMirror from 'codemirror';

export default class HighlitPlugin extends Plugin {
	private previousCursorPosition: CodeMirror.Position = undefined;
	private readonly codeMirrorEditors: CodeMirror.Editor[] = [];
	private readonly orderedListRegex: RegExp = new RegExp(
		'(^[0-9]+.\\s)(\\w*\\s*)*:?\\s?',
	);

	private readonly registerPreviousCursor = (editor: CodeMirror.Editor) =>
		(this.previousCursorPosition = editor.getCursor());

	private readonly handleKeyup = (
		editor: CodeMirror.Editor,
		_e: KeyboardEvent,
	) => this.registerPreviousCursor(editor);
	private readonly handleKeydown = (
		editor: CodeMirror.Editor,
		_e: KeyboardEvent,
	) => this.replaceWhileTyping(editor);

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

		const cursorDiff: number =
			currentCursorPosition.ch - this.previousCursorPosition.ch;
		const isSameCursor: boolean =
			currentCursorPosition.line === this.previousCursorPosition.line &&
			(cursorDiff === 0 || cursorDiff === 1);

		if (isSameCursor) {
			const token: CodeMirror.Token = editor.getTokenAt(currentCursorPosition);

			if (token.string === ':') {
				const line: number = currentCursorPosition.line;
				let lineText: string = editor.getLine(line);
				lineText = lineText.slice(0, lineText.indexOf(':') + 1);

				const isLineAlreadyBolded: boolean = lineText.startsWith('**');
				const isUnorderedLine: boolean = lineText.startsWith('- ');
				const isOrderedList: boolean = this.orderedListRegex.test(lineText);

				const startOfLineOffset: number = 0;
				let replacementOffset: number = startOfLineOffset;

				if (isUnorderedLine) {
					replacementOffset = '- '.length;
					lineText = lineText.slice(replacementOffset);
				} else if (isOrderedList) {
					replacementOffset = lineText.indexOf('.', 0) + 2;
					lineText = lineText.slice(replacementOffset);
				}

				if (!isLineAlreadyBolded) {
					editor.replaceRange(
						`**${lineText}**`,
						{ line: line, ch: replacementOffset },
						{ line: line, ch: token.end },
					);
				}
			}
		}
	}
}
