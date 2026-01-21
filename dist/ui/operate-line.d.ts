import Quill from 'quill';
import type { QuillTableBetter, TableColgroup } from '../types';
interface Options {
    tableNode: HTMLElement;
    cellNode: Element;
    mousePosition: {
        clientX: number;
        clientY: number;
    };
}
declare class OperateLine {
    quill: Quill;
    options: Options | null;
    drag: boolean;
    line: HTMLElement | null;
    dragBlock: HTMLElement | null;
    dragTable: HTMLElement | null;
    direction: string | null;
    tableBetter: QuillTableBetter;
    constructor(quill: Quill, tableBetter?: QuillTableBetter);
    createDragBlock(): void;
    createDragTable(table: Element): void;
    createOperateLine(): void;
    getCorrectCol(colgroup: TableColgroup, sum: number): import("../formats/table").TableCol;
    getDragTableProperty(table: Element): {
        left: string;
        top: string;
        width: string;
        height: string;
        display: string;
    };
    getLevelColSum(cell: Element): number;
    getMaxColNum(cell: Element): number;
    getProperty(options: Options): {
        dragBlockProps: {
            width: string;
            height: string;
            top: string;
            left: string;
            display: string;
        };
        containerProps: {
            width: string;
            height: string;
            top: string;
            left: string;
            display: string;
            cursor: string;
        };
        lineProps: {
            width: string;
            height: string;
        };
    } | {
        dragBlockProps: {
            width: string;
            height: string;
            top: string;
            left: string;
            display: string;
        };
        containerProps?: undefined;
        lineProps?: undefined;
    };
    getVerticalCells(cell: Element, rowspan: number): HTMLCollection;
    handleMouseMove(e: MouseEvent): void;
    hideDragBlock(): void;
    hideDragTable(): void;
    hideLine(): void;
    isLine(node: Element): boolean;
    setCellLevelRect(cell: Element, clientX: number): void;
    setCellRect(cell: Element, clientX: number, clientY: number): void;
    setCellsRect(cell: Element, changeX: number, changeY: number): void;
    setColWidth(domNode: HTMLElement, width: string, isPercent: boolean): void;
    setCellVerticalRect(cell: Element, clientY: number): void;
    toggleLineChildClass(isAdd: boolean): void;
    updateCell(node: Element): void;
    updateDragBlock(clientX: number, clientY: number): void;
    updateDragLine(clientX: number, clientY: number): void;
    updateDragTable(clientX: number, clientY: number): void;
    updateProperty(options: Options): void;
}
export default OperateLine;
