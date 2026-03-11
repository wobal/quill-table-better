import type { BlockBlot } from 'parchment';
import type { Props, TableCellChildren } from '../types';
import { TableCell } from './table';
declare const Header: typeof BlockBlot;
declare class TableHeader extends Header {
    static blotName: string;
    static className: string;
    next: this | null;
    parent: TableCell;
    static create(formats: Props): HTMLElement;
    format(name: string, value: string, isReplace?: boolean): import("parchment").Blot;
    static formats(domNode: HTMLElement): {
        cellId: string;
        value: number;
    };
    formats(): {
        [key: string]: any;
    };
    getCellFormats(parent: TableCell | TableCellChildren): any[];
}
export default TableHeader;
