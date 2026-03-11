import Quill from 'quill';
import type { EmitterSource, Range } from 'quill';
import type { Props } from './types';
import type { BindingObject } from './types/keyboard';
import { TableCell, TableRow, TableContainer } from './formats/table';
import Language from './language';
import CellSelection from './ui/cell-selection';
import OperateLine from './ui/operate-line';
import TableMenus from './ui/table-menus';
import { TableSelect } from './ui/toolbar-table';
export interface Options {
    language?: string | {
        name: string;
        content: Props;
    };
    menus?: string[];
    toolbarButtons?: {
        whiteList?: string[];
        singleWhiteList?: string[];
    };
    toolbarTable?: boolean;
    scale?: number;
    colors?: string[];
    nowarn?: boolean;
}
declare const Module: typeof import("quill/core/module").default;
declare class Table extends Module {
    language: Language;
    cellSelection: CellSelection;
    operateLine: OperateLine;
    tableMenus: TableMenus;
    tableSelect: TableSelect;
    options: Options;
    scale: number;
    colors: string[];
    nowarn: boolean;
    static keyboardBindings: {
        [propName: string]: BindingObject;
    };
    static register(): void;
    constructor(quill: Quill, options: Options);
    clearHistorySelected(): void;
    deleteTable(): void;
    deleteTableTemporary(source?: EmitterSource): void;
    getTable(range?: Range): [null, null, null, -1] | [TableContainer, TableRow, TableCell, number];
    handleKeyup(e: KeyboardEvent): void;
    handleMousedown(e: MouseEvent): void;
    handleMouseMove(): void;
    handleScroll(): void;
    hideTools(): void;
    insertTable(rows: number, columns: number): void;
    private isTable;
    listenDeleteTable(): void;
    private registerToolbarTable;
    showTools(force?: boolean): void;
    private updateMenus;
}
export default Table;
