import Quill from 'quill';
import type { CorrectBound, Props, QuillTableBetter, TableCellMap, TableColgroup } from '../types';
import { TableCell, TableRow } from '../formats/table';
import TablePropertiesForm from './table-properties-form';
interface Children {
    [propName: string]: {
        content: string;
        handler: () => void;
        divider?: boolean;
        createSwitch?: boolean;
    };
}
declare class TableMenus {
    quill: Quill;
    table: HTMLElement | null;
    root: HTMLElement;
    prevList: HTMLUListElement | null;
    prevTooltip: HTMLDivElement | null;
    scroll: boolean;
    tableBetter: QuillTableBetter;
    tablePropertiesForm: TablePropertiesForm;
    tableHeaderRow: HTMLElement | null;
    constructor(quill: Quill, tableBetter?: QuillTableBetter);
    convertToRow(): void;
    convertToHeaderRow(): void;
    copyTable(): Promise<void>;
    createList(children: Children): HTMLUListElement;
    createMenu(left: string, right: string, isDropDown: boolean, category: string): HTMLDivElement;
    createMenus(): HTMLDivElement;
    createSwitch(content: string): DocumentFragment;
    deleteColumn(isKeyboard?: boolean): void;
    deleteRow(isKeyboard?: boolean): void;
    deleteTable(): void;
    destroyTablePropertiesForm(): void;
    disableMenu(category: string, disabled?: boolean): void;
    getCellsOffset(computeBounds: CorrectBound, bounds: CorrectBound, leftColspan: number, rightColspan: number): number;
    getColsOffset(colgroup: TableColgroup, computeBounds: CorrectBound, bounds: CorrectBound): number;
    getCorrectBounds(table: HTMLElement): CorrectBound[];
    getCorrectTds(selectTds: Element[], computeBounds: CorrectBound, leftTd: Element, rightTd: Element): {
        changeTds: [Element, number][];
        selTds: Element[];
    };
    getCorrectRows(): TableRow[];
    getDiffOffset(map: TableCellMap, colspan?: number): number;
    getRefInfo(row: TableRow, right: number): {
        id: string;
        ref: TableCell;
    };
    getSelectedTdAttrs(td: HTMLElement): Props;
    getSelectedTdsAttrs(selectedTds: HTMLElement[]): Props;
    getSelectedTdsInfo(): {
        computeBounds: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
        leftTd: Element;
        rightTd: Element;
    };
    getTableAlignment(table: HTMLTableElement): string;
    getTdsFromMap(map: TableCellMap): HTMLElement[];
    handleClick(e: MouseEvent): void;
    hideMenus(): void;
    insertColumn(td: HTMLTableColElement, offset: number): void;
    insertParagraph(offset: number): void;
    insertRow(td: HTMLTableColElement, offset: number): void;
    mergeCells(): void;
    selectColumn(): void;
    selectRow(): void;
    setCellsMap(cell: TableCell, map: TableCellMap): void;
    showMenus(): void;
    splitCell(): void;
    toggleAttribute(list: HTMLUListElement, tooltip: HTMLDivElement, e?: PointerEvent): void;
    toggleHeaderRow(): void;
    toggleHeaderRowSwitch(value?: string): void;
    updateMenus(table?: HTMLElement): void;
    updateScroll(scroll: boolean): void;
    updateTable(table: HTMLElement): void;
}
export default TableMenus;
