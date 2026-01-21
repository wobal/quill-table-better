import type { Range } from 'quill';
import type { QuillTableBetter, TableCellChildren } from '../types';
declare const Toolbar: typeof import("quill/core/module").default;
declare type Handler = (this: TableToolbar, value: any) => void;
declare class TableToolbar extends Toolbar {
    handlers: Record<string, Handler>;
    controls: [string, HTMLElement][];
    update: (range: Range | null) => void;
    container?: HTMLElement | null;
    attach(input: HTMLElement): void;
    private cellSelectionAttach;
    getTableBetter(): QuillTableBetter;
    setTableFormat(range: Range, selectedTds: Element[], value: string, name: string, lines: TableCellChildren[]): TableCellChildren;
    private toolbarAttach;
}
export default TableToolbar;
