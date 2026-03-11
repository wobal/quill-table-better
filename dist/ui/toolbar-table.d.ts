import type { InlineBlot } from 'parchment';
import type { InsertTableHandler } from '../types';
declare const Inline: typeof InlineBlot;
declare class ToolbarTable extends Inline {
}
declare class TableSelect {
    computeChildren: Element[];
    root: HTMLDivElement;
    constructor();
    clearSelected(children: NodeListOf<Element> | Element[]): void;
    createContainer(): HTMLDivElement;
    getClickInfo(e: MouseEvent): [boolean, Element];
    getComputeChildren(children: HTMLCollection, e: MouseEvent): Element[];
    getSelectAttrs(element: Element): number[];
    handleClick(e: MouseEvent, insertTable: InsertTableHandler): void;
    handleMouseMove(e: MouseEvent, container: Element): void;
    hide(element: Element): void;
    insertTable(child: Element, insertTable: InsertTableHandler): void;
    setLabelContent(label: Element, child: Element): void;
    show(element: Element): void;
    toggle(element: Element, isBetweenSpans: boolean): void;
}
export { TableSelect, ToolbarTable as default };
