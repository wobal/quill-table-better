import type { BlockBlot, ContainerBlot } from 'parchment';
import type { Props, TableCellChildren } from '../types';
import { TableCell } from './table';
declare const List: typeof BlockBlot;
declare const Container: typeof ContainerBlot;
declare class ListContainer extends Container {
    next: this | null;
    parent: TableCell;
    static create(value: Props): HTMLElement;
    format(name: string, value: string | Props): import("parchment").Parent;
    static formats(domNode: HTMLElement): Props;
    formats(): {
        [x: number]: any;
    };
}
declare class TableList extends List {
    parent: ListContainer;
    format(name: string, value: string | Props, isReplace?: boolean): import("parchment").Blot;
    getCellFormats(parent: TableCell | TableCellChildren): [Props, string];
    getCorrectCellFormats(value: Props): [Props, string, string];
    private getListContainer;
    static register(): void;
    setReplace(isReplace: boolean, formats: Props): void;
}
export { ListContainer, TableList as default };
