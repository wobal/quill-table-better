import Delta from 'quill-delta';
import type { Range } from 'quill';
declare const Clipboard: typeof import("quill/core/module").default;
declare class TableClipboard extends Clipboard {
    convert: ({ html, text }: {
        html?: string;
        text?: string;
    }, formats?: Record<string, unknown>) => Delta;
    onPaste(range: Range, { text, html }: {
        text?: string;
        html?: string;
    }): void;
    private getTableDelta;
}
export default TableClipboard;
