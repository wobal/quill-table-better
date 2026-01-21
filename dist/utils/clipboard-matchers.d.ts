import Delta from 'quill-delta';
import type { Props } from '../types';
declare function applyFormat(delta: Delta, format: Props | string, value?: any): Delta;
declare function matchTable(node: HTMLTableRowElement, delta: Delta): Delta;
declare function matchTableCell(node: HTMLTableCellElement, delta: Delta): Delta;
declare function matchTableCol(node: HTMLElement, delta: Delta): Delta;
declare function matchTableTemporary(node: HTMLElement, delta: Delta): Delta;
export { applyFormat, matchTable, matchTableCell, matchTableCol, matchTableTemporary };
